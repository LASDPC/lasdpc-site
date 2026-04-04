from fastapi import APIRouter, HTTPException, status

from core.database import get_db
from core.security import verify_password, create_access_token
from models.user import LoginRequest, LoginResponse, UserOut

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": user["email"]})
    return LoginResponse(
        access_token=token,
        user=UserOut(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            role=user["role"],
            avatar=user.get("avatar"),
            initials=user["initials"],
        ),
    )
