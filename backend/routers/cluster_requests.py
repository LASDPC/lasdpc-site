import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from core.database import get_db
from core.dependencies import get_current_user, require_admin
from models.cluster_request import (
    ClusterRequestApprove,
    ClusterRequestCreate,
    ClusterRequestOut,
    ClusterUsageOut,
)

router = APIRouter()
PRE_RESERVATION_HOURS = 24


def _to_out(doc: dict) -> ClusterRequestOut:
    return ClusterRequestOut(
        id=str(doc["_id"]),
        **{k: doc[k] for k in ClusterRequestOut.model_fields if k != "id" and k in doc},
    )


def _to_usage_out(doc: dict) -> ClusterUsageOut:
    return ClusterUsageOut(
        id=str(doc["_id"]),
        cluster_id=doc["cluster_id"],
        cluster_name=doc["cluster_name"],
        user_name=doc.get("user_name", ""),
        start_date=doc["start_date"],
        end_date=doc["end_date"],
        status=doc["status"],
        access_starts_at=doc.get("access_starts_at"),
        access_ends_at=doc.get("access_ends_at"),
    )


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _access_key() -> str:
    raw = secrets.token_urlsafe(12).replace("-", "").replace("_", "")
    return f"LASDPC-{raw[:12].upper()}"


async def _expire_old_pre_reservations(db) -> None:
    now = _utc_now()
    now_iso = now.isoformat()
    legacy_cutoff = (now - timedelta(hours=PRE_RESERVATION_HOURS)).isoformat()
    await db.cluster_requests.update_many(
        {
            "status": "pending",
            "$or": [
                {"pre_reservation_expires_at": {"$lt": now_iso}},
                {
                    "pre_reservation_expires_at": {"$exists": False},
                    "created_at": {"$lt": legacy_cutoff},
                },
            ],
        },
        {"$set": {"status": "expired", "resolved_at": now_iso}},
    )


@router.post("", response_model=ClusterRequestOut, status_code=status.HTTP_201_CREATED)
async def create_request(body: ClusterRequestCreate, user: dict = Depends(get_current_user)):
    if body.end_date < body.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_date must be after start_date")

    db = get_db()
    cluster = await db.clusters.find_one({"_id": ObjectId(body.cluster_id)})
    if not cluster:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cluster not found")

    now = _utc_now()
    expires_at = now + timedelta(hours=PRE_RESERVATION_HOURS)
    doc = {
        "user_id": user["_id"],
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "cluster_id": body.cluster_id,
        "cluster_name": cluster["name"],
        "start_date": body.start_date,
        "end_date": body.end_date,
        "observation": body.observation,
        "custom_field_values": body.custom_field_values,
        "custom_field_defs": cluster.get("custom_fields", []),
        "status": "pending",
        "created_at": now.isoformat(),
        "pre_reservation_expires_at": expires_at.isoformat(),
        "resolved_at": None,
        "approved_at": None,
        "access_key": None,
        "access_starts_at": None,
        "access_ends_at": None,
        "access_revoked_at": None,
    }
    result = await db.cluster_requests.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_out(doc)


@router.get("", response_model=list[ClusterRequestOut])
async def list_requests(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    await _expire_old_pre_reservations(db)
    query = {"status": status_filter} if status_filter else {}
    items = await db.cluster_requests.find(query).sort("created_at", -1).to_list(1000)
    return [_to_out(d) for d in items]


@router.get("/mine", response_model=list[ClusterRequestOut])
async def my_requests(user: dict = Depends(get_current_user)):
    db = get_db()
    await _expire_old_pre_reservations(db)
    items = await db.cluster_requests.find({"user_id": user["_id"]}).sort("created_at", -1).to_list(1000)
    return [_to_out(d) for d in items]


@router.get("/calendar", response_model=list[ClusterUsageOut])
async def cluster_usage_calendar(
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
    _user: dict = Depends(get_current_user),
):
    db = get_db()
    await _expire_old_pre_reservations(db)
    query: dict = {"status": {"$in": ["approved", "revoked"]}}
    if start and end:
        query["start_date"] = {"$lte": end}
        query["end_date"] = {"$gte": start}
    items = await db.cluster_requests.find(query).sort("start_date", 1).to_list(1000)
    return [_to_usage_out(d) for d in items]


@router.get("/pending", response_model=list[ClusterRequestOut])
async def list_pending(_admin: dict = Depends(require_admin)):
    db = get_db()
    await _expire_old_pre_reservations(db)
    items = await db.cluster_requests.find({"status": "pending"}).sort("created_at", -1).to_list(1000)
    return [_to_out(d) for d in items]


@router.put("/{request_id}/approve", response_model=ClusterRequestOut)
async def approve_request(
    request_id: str,
    body: Optional[ClusterRequestApprove] = None,
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    await _expire_old_pre_reservations(db)
    req = await db.cluster_requests.find_one({"_id": ObjectId(request_id), "status": "pending"})
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending request not found")

    payload = body or ClusterRequestApprove()
    now_iso = _utc_now().isoformat()
    access_key = payload.access_key or _access_key()
    access_starts_at = payload.access_starts_at or req["start_date"]
    access_ends_at = payload.access_ends_at or req["end_date"]

    await db.cluster_requests.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": "approved",
                "approved_at": now_iso,
                "resolved_at": now_iso,
                "access_key": access_key,
                "access_starts_at": access_starts_at,
                "access_ends_at": access_ends_at,
                "access_revoked_at": None,
            }
        },
    )

    # Create notification for the user
    await db.notifications.insert_one({
        "user_id": req["user_id"],
        "type": "cluster_approved",
        "cluster_request_id": request_id,
        "cluster_name": req["cluster_name"],
        "start_date": req["start_date"],
        "end_date": req["end_date"],
        "access_key": access_key,
        "access_starts_at": access_starts_at,
        "access_ends_at": access_ends_at,
        "created_at": now_iso,
    })

    doc = await db.cluster_requests.find_one({"_id": ObjectId(request_id)})
    return _to_out(doc)


@router.put("/{request_id}/reject", response_model=ClusterRequestOut)
async def reject_request(request_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    await _expire_old_pre_reservations(db)
    req = await db.cluster_requests.find_one({"_id": ObjectId(request_id), "status": "pending"})
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending request not found")

    now_iso = _utc_now().isoformat()
    await db.cluster_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "rejected", "resolved_at": now_iso}},
    )

    # Create notification for the user
    await db.notifications.insert_one({
        "user_id": req["user_id"],
        "type": "cluster_rejected",
        "cluster_request_id": request_id,
        "cluster_name": req["cluster_name"],
        "start_date": req["start_date"],
        "end_date": req["end_date"],
        "created_at": now_iso,
    })

    doc = await db.cluster_requests.find_one({"_id": ObjectId(request_id)})
    return _to_out(doc)


@router.put("/{request_id}/revoke", response_model=ClusterRequestOut)
async def revoke_request(request_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    req = await db.cluster_requests.find_one({"_id": ObjectId(request_id), "status": "approved"})
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approved request not found")

    now_iso = _utc_now().isoformat()
    await db.cluster_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "revoked", "access_revoked_at": now_iso, "resolved_at": now_iso}},
    )

    await db.notifications.insert_one({
        "user_id": req["user_id"],
        "type": "cluster_revoked",
        "cluster_request_id": request_id,
        "cluster_name": req["cluster_name"],
        "start_date": req["start_date"],
        "end_date": req["end_date"],
        "created_at": now_iso,
    })

    doc = await db.cluster_requests.find_one({"_id": ObjectId(request_id)})
    return _to_out(doc)
