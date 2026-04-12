from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_db
from core.dependencies import get_current_user, require_admin
from models.cluster_request import ClusterRequestCreate, ClusterRequestOut

router = APIRouter()


def _to_out(doc: dict) -> ClusterRequestOut:
    return ClusterRequestOut(
        id=str(doc["_id"]),
        **{k: doc[k] for k in ClusterRequestOut.model_fields if k != "id" and k in doc},
    )


@router.post("", response_model=ClusterRequestOut, status_code=status.HTTP_201_CREATED)
async def create_request(body: ClusterRequestCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    cluster = await db.clusters.find_one({"_id": ObjectId(body.cluster_id)})
    if not cluster:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cluster not found")

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
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.cluster_requests.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_out(doc)


@router.get("/mine", response_model=list[ClusterRequestOut])
async def my_requests(user: dict = Depends(get_current_user)):
    db = get_db()
    items = await db.cluster_requests.find({"user_id": user["_id"]}).sort("created_at", -1).to_list(1000)
    return [_to_out(d) for d in items]


@router.get("/pending", response_model=list[ClusterRequestOut])
async def list_pending(_admin: dict = Depends(require_admin)):
    db = get_db()
    items = await db.cluster_requests.find({"status": "pending"}).sort("created_at", -1).to_list(1000)
    return [_to_out(d) for d in items]


@router.put("/{request_id}/approve", response_model=ClusterRequestOut)
async def approve_request(request_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    req = await db.cluster_requests.find_one({"_id": ObjectId(request_id), "status": "pending"})
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending request not found")

    await db.cluster_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "approved"}},
    )

    # Create notification for the user
    await db.notifications.insert_one({
        "user_id": req["user_id"],
        "type": "cluster_approved",
        "cluster_request_id": request_id,
        "cluster_name": req["cluster_name"],
        "start_date": req["start_date"],
        "end_date": req["end_date"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    doc = await db.cluster_requests.find_one({"_id": ObjectId(request_id)})
    return _to_out(doc)


@router.put("/{request_id}/reject", response_model=ClusterRequestOut)
async def reject_request(request_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    req = await db.cluster_requests.find_one({"_id": ObjectId(request_id), "status": "pending"})
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending request not found")

    await db.cluster_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "rejected"}},
    )

    # Create notification for the user
    await db.notifications.insert_one({
        "user_id": req["user_id"],
        "type": "cluster_rejected",
        "cluster_request_id": request_id,
        "cluster_name": req["cluster_name"],
        "start_date": req["start_date"],
        "end_date": req["end_date"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    doc = await db.cluster_requests.find_one({"_id": ObjectId(request_id)})
    return _to_out(doc)
