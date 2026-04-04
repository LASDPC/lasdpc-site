from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_db
from core.dependencies import get_current_user, require_admin
from core.security import hash_password
from models.user import UserCreate, UserOut

router = APIRouter()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(body: UserCreate, _admin: dict = Depends(require_admin)):
    db = get_db()
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    doc = {
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "name": body.name,
        "role": body.role,
        "avatar": body.avatar,
        "initials": body.initials,
    }
    result = await db.users.insert_one(doc)
    return UserOut(id=str(result.inserted_id), email=body.email, name=body.name, role=body.role, avatar=body.avatar, initials=body.initials)


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return UserOut(
        id=user["_id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        avatar=user.get("avatar"),
        initials=user["initials"],
    )
