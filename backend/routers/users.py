import secrets

from bson import ObjectId
from fastapi import APIRouter, Depends, Header, HTTPException, status

from core.config import settings
from core.database import get_db
from core.dependencies import get_current_user, require_admin
from core.security import hash_password
from models.user import BootstrapAdmin, UserCreate, UserUpdate, UserOut

router = APIRouter()


def _user_out(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        **{k: doc.get(k) for k in UserOut.model_fields if k != "id" and k in doc},
    )


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
    doc["hashed_password"] = hash_password(doc.pop("password"))
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _user_out(doc)


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


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str):
    db = get_db()
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _user_out(doc)


@router.put("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, body: UserUpdate, current_user: dict = Depends(get_current_user)):
    is_own_profile = current_user["_id"] == user_id
    if not is_own_profile and not current_user.get("is_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    db = get_db()
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not current_user.get("is_admin"):
        update_data.pop("is_admin", None)
        update_data.pop("role", None)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nothing to update")
    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    return _user_out(doc)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
