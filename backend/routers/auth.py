from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, status

from core.database import get_db
from core.security import verify_password, create_access_token, hash_password
from models.user import LoginRequest, LoginResponse, RegisterRequest, UserOut

router = APIRouter()

STUDENT_ROLES = {"aluno_ativo", "alumni"}


def _initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper()


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    db = get_db()
    # If identifier contains '@', search by email; otherwise by usp_number
    if "@" in body.identifier:
        user = await db.users.find_one({"email": body.identifier})
    else:
        user = await db.users.find_one({"usp_number": body.identifier})
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
    if not body.lgpd_consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LGPD consent is required",
        )
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if body.usp_number:
        existing_usp = await db.users.find_one({"usp_number": body.usp_number})
        if existing_usp:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="USP number already registered")
    if body.role not in ("docente", "aluno_ativo", "alumni"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    registration_objective = body.registration_objective.strip()
    if not registration_objective:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration objective is required")
    advisor = None
    level = (body.level or "").strip()
    level_pt = (body.levelPt or "").strip()
    if body.role in STUDENT_ROLES:
        if not body.advisor_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Advisor is required for students")
        try:
            advisor_object_id = ObjectId(body.advisor_id)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid advisor")
        advisor = await db.users.find_one({
            "_id": advisor_object_id,
            "role": "docente",
            "status": {"$ne": "pending"},
        })
        if not advisor:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid advisor")
        if not level or not level_pt:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Academic category is required for students")
    doc = {
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "name": body.name,
        "role": body.role,
        "is_admin": False,
        "avatar": None,
        "initials": _initials(body.name),
        "status": "pending",
        "advisor_id": str(advisor["_id"]) if advisor else None,
        "advisor_name": advisor.get("name") if advisor else None,
        "level": level or None,
        "levelPt": level_pt or None,
        "registration_objective": registration_objective,
        "observation": body.observation.strip(),
        "usp_number": body.usp_number,
        "lgpd_consent": True,
        "lgpd_consent_at": datetime.now(timezone.utc).isoformat(),
        "lgpd_consent_version": "1.0",
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _user_out(doc)


def _user_out(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        **{k: user.get(k) for k in UserOut.model_fields if k != "id" and k in user},
    )
