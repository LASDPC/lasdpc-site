from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "aluno_ativo"  # docente | aluno_ativo | alumni
    is_admin: bool = False
    avatar: Optional[str] = None
    initials: str
    # Docente-specific fields
    title: Optional[str] = None       # e.g. "Full Professor"
    titlePt: Optional[str] = None
    area: Optional[str] = None
    areaPt: Optional[str] = None
    lattes: Optional[str] = None
    orcid: Optional[str] = None
    scholar: Optional[str] = None
    page: Optional[str] = None
    photo: Optional[str] = None
    # Student-specific fields
    level: Optional[str] = None       # e.g. "PhD", "MSc"
    levelPt: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_admin: Optional[bool] = None
    avatar: Optional[str] = None
    initials: Optional[str] = None
    title: Optional[str] = None
    titlePt: Optional[str] = None
    area: Optional[str] = None
    areaPt: Optional[str] = None
    lattes: Optional[str] = None
    orcid: Optional[str] = None
    scholar: Optional[str] = None
    page: Optional[str] = None
    photo: Optional[str] = None
    level: Optional[str] = None
    levelPt: Optional[str] = None


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    is_admin: bool = False
    avatar: Optional[str] = None
    initials: str
    title: Optional[str] = None
    titlePt: Optional[str] = None
    area: Optional[str] = None
    areaPt: Optional[str] = None
    lattes: Optional[str] = None
    orcid: Optional[str] = None
    scholar: Optional[str] = None
    page: Optional[str] = None
    photo: Optional[str] = None
    level: Optional[str] = None
    levelPt: Optional[str] = None


class BootstrapAdmin(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
