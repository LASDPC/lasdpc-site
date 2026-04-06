import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, status

from core.config import settings
from core.database import get_db
from core.dependencies import get_current_user, require_admin
from core.security import hash_password
from models.user import BootstrapAdmin, UserCreate, UserOut

router = APIRouter()


@router.post("/bootstrap", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def bootstrap_admin(body: BootstrapAdmin, x_bootstrap_token: str = Header()):
    if not settings.admin_bootstrap_token or not secrets.compare_digest(
        x_bootstrap_token, settings.admin_bootstrap_token
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid bootstrap token")
    db = get_db()
    existing = await db.users.find_one({"role": "admin"})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admin already exists")
    names = body.name.strip().split()
    initials = (names[0][0] + names[-1][0]).upper() if len(names) >= 2 else body.name[:2].upper()
    doc = {
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "name": body.name,
        "role": "admin",
        "avatar": None,
        "initials": initials,
    }
    result = await db.users.insert_one(doc)
    return UserOut(id=str(result.inserted_id), email=body.email, name=body.name, role="admin", avatar=None, initials=initials)


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
