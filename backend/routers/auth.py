from fastapi import APIRouter, HTTPException, status

from core.database import get_db
from core.security import verify_password, create_access_token, hash_password
from models.user import LoginRequest, LoginResponse, RegisterRequest, UserOut

router = APIRouter()


def _initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper()


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    user_status = user.get("status", "active")
    if user_status == "pending":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account pending approval")
    if user_status == "rejected":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account rejected")
    token = create_access_token({"sub": user["email"]})
    return LoginResponse(
        access_token=token,
        user=_user_out(user),
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    db = get_db()
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if body.role not in ("docente", "aluno_ativo", "alumni"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    doc = {
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "name": body.name,
        "role": body.role,
        "is_admin": False,
        "avatar": None,
        "initials": _initials(body.name),
        "status": "pending",
        "observation": body.observation,
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _user_out(doc)


def _user_out(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        **{k: user.get(k) for k in UserOut.model_fields if k != "id" and k in user},
    )
