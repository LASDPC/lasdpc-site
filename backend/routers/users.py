import re
import secrets
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from core.config import settings
from core.database import get_db
from core.dependencies import get_current_user, require_admin
from core.profile_terms import normalize_profile_payload, upsert_profile_terms, validate_required_profile
from core.security import hash_password
from models.user import (
    BootstrapAdmin,
    LgpdDeletionRequest,
    LgpdRequestOut,
    UserCreate,
    UserUpdate,
    UserOut,
)

router = APIRouter()

# Fields that non-admins cannot modify
ADMIN_ONLY_FIELDS = {"is_admin", "role", "usp_number", "lgpd_consent", "lgpd_consent_at", "lgpd_consent_version"}
STUDENT_ROLES = {"aluno_ativo", "alumni"}


def _user_out(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        **{k: doc.get(k) for k in UserOut.model_fields if k != "id" and k in doc},
    )


def _is_photo_only_update(update_data: dict) -> bool:
    return set(update_data.keys()) == {"photo"}


@router.post("/bootstrap", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def bootstrap_admin(body: BootstrapAdmin, x_bootstrap_token: str = Header()):
    if not settings.admin_bootstrap_token or not secrets.compare_digest(
        x_bootstrap_token, settings.admin_bootstrap_token
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid bootstrap token")
    db = get_db()
    existing = await db.users.find_one({"is_admin": True})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admin already exists")
    names = body.name.strip().split()
    initials = (names[0][0] + names[-1][0]).upper() if len(names) >= 2 else body.name[:2].upper()
    doc = {
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "name": body.name,
        "role": "docente",
        "is_admin": True,
        "avatar": None,
        "initials": initials,
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _user_out(doc)


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(body: UserCreate, _admin: dict = Depends(require_admin)):
    db = get_db()
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    doc = body.model_dump()
    if doc.get("role") in STUDENT_ROLES:
        advisor_id = doc.get("advisor_id")
        if not advisor_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Advisor is required for students")
        try:
            advisor_object_id = ObjectId(advisor_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid advisor")
        advisor = await db.users.find_one({
            "_id": advisor_object_id,
            "role": "docente",
            "status": {"$ne": "pending"},
        })
        if not advisor:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid advisor")
        doc["advisor_id"] = str(advisor["_id"])
        doc["advisor_name"] = advisor.get("name")
        if not doc.get("level") or not doc.get("levelPt"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Academic category is required for students")
    normalize_profile_payload(doc)
    validate_required_profile(doc)
    doc["hashed_password"] = hash_password(doc.pop("password"))
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    await upsert_profile_terms(db, doc)
    return _user_out(doc)


@router.get("", response_model=list[UserOut])
async def list_users(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    query = {"status": status_filter} if status_filter else {}
    items = await db.users.find(query).sort("name", 1).to_list(1000)
    return [_user_out(d) for d in items]


@router.get("/pending")
async def list_pending(_admin: dict = Depends(require_admin)):
    db = get_db()
    items = await db.users.find({"status": "pending"}).to_list(1000)
    result = []
    for d in items:
        out = _user_out(d).model_dump()
        out["observation"] = d.get("observation", "")
        result.append(out)
    return result


@router.put("/{user_id}/approve", response_model=UserOut)
async def approve_user(user_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id), "status": "pending"},
        {"$set": {"status": "active"}, "$unset": {"observation": ""}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending user not found")
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    return _user_out(doc)


@router.put("/{user_id}/reject", response_model=UserOut)
async def reject_user(user_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id), "status": "pending"},
        {"$set": {"status": "rejected"}, "$unset": {"observation": ""}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending user not found")
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    return _user_out(doc)


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return _user_out(user)


@router.get("/suggest")
async def suggest_users(
    query: str = Query("", min_length=0, max_length=100),
    limit: int = Query(100, ge=1, le=100),
    _user: dict = Depends(get_current_user),
):
    """
    Suggest users for participant invites.
    Match on email, name, or USP number, limited to 100 results.
    Returns a minimal payload to power typeahead UI.
    """
    db = get_db()
    q = query.strip()
    if not q:
        items = await db.users.find({"status": {"$nin": ["pending", "rejected"]}}).limit(limit).to_list(limit)
    else:
        regex = {"$regex": re.escape(q), "$options": "i"}
        items = await db.users.find(
            {
                "status": {"$nin": ["pending", "rejected"]},
                "$or": [{"email": regex}, {"name": regex}, {"usp_number": regex}],
            }
        ).limit(limit).to_list(limit)
    return [
        {
            "id": str(d["_id"]),
            "email": d.get("email"),
            "name": d.get("name"),
            "initials": d.get("initials"),
            "photo": d.get("photo"),
            "avatar": d.get("avatar"),
            "usp_number": d.get("usp_number"),
            "role": d.get("role"),
        }
        for d in items
    ]


# ---- LGPD self-service endpoints ---- #

@router.post("/me/lgpd/export")
async def lgpd_export(user: dict = Depends(get_current_user)):
    db = get_db()
    # Record the request
    lgpd_doc = {
        "user_id": str(user["_id"]),
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "request_type": "export",
        "status": "completed",
        "reason": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "resolved_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.lgpd_requests.insert_one(lgpd_doc)
    # Return user data (exclude hashed_password)
    export = {k: v for k, v in user.items() if k not in ("hashed_password",)}
    export["_id"] = str(export["_id"])
    return export


@router.post("/me/lgpd/deletion")
async def lgpd_deletion(body: LgpdDeletionRequest, user: dict = Depends(get_current_user)):
    db = get_db()
    # Check for existing pending deletion request
    existing = await db.lgpd_requests.find_one({
        "user_id": str(user["_id"]),
        "request_type": "deletion",
        "status": "pending",
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A deletion request is already pending",
        )
    lgpd_doc = {
        "user_id": str(user["_id"]),
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "request_type": "deletion",
        "status": "pending",
        "reason": body.reason,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "resolved_at": None,
    }
    await db.lgpd_requests.insert_one(lgpd_doc)
    return {"message": "Deletion request submitted"}


# ---- Admin LGPD management ---- #

@router.get("/lgpd-requests", response_model=list[LgpdRequestOut])
async def list_lgpd_requests(_admin: dict = Depends(require_admin)):
    db = get_db()
    items = await db.lgpd_requests.find({"status": "pending"}).to_list(1000)
    return [
        LgpdRequestOut(id=str(d["_id"]), **{k: d[k] for k in LgpdRequestOut.model_fields if k != "id"})
        for d in items
    ]


@router.put("/lgpd-requests/{request_id}/complete")
async def complete_lgpd_request(request_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    req = await db.lgpd_requests.find_one({"_id": ObjectId(request_id)})
    if not req or req["status"] != "pending":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending LGPD request not found")

    now = datetime.now(timezone.utc).isoformat()
    await db.lgpd_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "completed", "resolved_at": now}},
    )

    # If deletion, anonymize the user
    if req["request_type"] == "deletion":
        user_id = req["user_id"]
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "name": "[Removido]",
                "email": f"deleted_{user_id}@anon.invalid",
                "status": "rejected",
                "photo": None,
                "avatar": None,
                "bio": None,
                "bioPt": None,
                "linkedin": None,
                "github": None,
                "twitter": None,
                "researchgate": None,
                "usp_number": None,
                "skills": None,
                "research_areas": None,
            }},
        )

    return {"message": "LGPD request completed"}


@router.put("/lgpd-requests/{request_id}/reject")
async def reject_lgpd_request(request_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    req = await db.lgpd_requests.find_one({"_id": ObjectId(request_id)})
    if not req or req["status"] != "pending":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending LGPD request not found")
    now = datetime.now(timezone.utc).isoformat()
    await db.lgpd_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "rejected", "resolved_at": now}},
    )
    return {"message": "LGPD request rejected"}


# ---- Standard CRUD ---- #

@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str):
    db = get_db()
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _user_out(doc)


@router.put("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, body: UserUpdate, current_user: dict = Depends(get_current_user)):
    is_own_profile = str(current_user["_id"]) == user_id
    if not is_own_profile and not current_user.get("is_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    db = get_db()
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not current_user.get("is_admin"):
        for field in ADMIN_ONLY_FIELDS:
            update_data.pop(field, None)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nothing to update")
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")
    existing = await db.users.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    normalize_profile_payload(update_data)
    updated_doc = {**existing, **update_data}
    if not _is_photo_only_update(update_data):
        validate_required_profile(updated_doc)
    result = await db.users.update_one({"_id": oid}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    doc = await db.users.find_one({"_id": oid})
    await upsert_profile_terms(db, doc)
    return _user_out(doc)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
