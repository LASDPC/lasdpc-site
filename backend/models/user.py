from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "normal"
    avatar: str | None = None
    initials: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    avatar: str | None = None
    initials: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
