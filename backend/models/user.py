from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "aluno_ativo"  # docente | aluno_ativo | alumni
    advisor_id: Optional[str] = None
    advisor_name: Optional[str] = None
    level: Optional[str] = None
    levelPt: Optional[str] = None
    registration_objective: str = Field(..., min_length=1, max_length=1000)
    observation: str = Field(default="", max_length=150)
    usp_number: Optional[str] = None
    lgpd_consent: bool = False


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "aluno_ativo"  # docente | aluno_ativo | alumni
    is_admin: bool = False
    avatar: Optional[str] = None
    initials: str
    status: str = "active"  # active | pending | rejected
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
    advisor_id: Optional[str] = None
    advisor_name: Optional[str] = None
    registration_objective: Optional[str] = None
    observation: Optional[str] = Field(default=None, max_length=150)
    # Enriched profile
    research_areas: Optional[list[str]] = None
    year_joined: Optional[int] = None
    bio: Optional[str] = None
    bioPt: Optional[str] = None
    skills: Optional[list[str]] = None
    graduation_year: Optional[int] = None
    # Social links
    linkedin: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    researchgate: Optional[str] = None
    # USP
    usp_number: Optional[str] = None


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
    advisor_id: Optional[str] = None
    advisor_name: Optional[str] = None
    registration_objective: Optional[str] = None
    observation: Optional[str] = Field(default=None, max_length=150)
    # Enriched profile
    research_areas: Optional[list[str]] = None
    year_joined: Optional[int] = None
    bio: Optional[str] = None
    bioPt: Optional[str] = None
    skills: Optional[list[str]] = None
    graduation_year: Optional[int] = None
    # Social links
    linkedin: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    researchgate: Optional[str] = None
    # USP
    usp_number: Optional[str] = None
    # LGPD
    lgpd_consent: Optional[bool] = None
    lgpd_consent_at: Optional[str] = None
    lgpd_consent_version: Optional[str] = None


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    is_admin: bool = False
    avatar: Optional[str] = None
    initials: str
    status: str = "active"
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
    advisor_id: Optional[str] = None
    advisor_name: Optional[str] = None
    registration_objective: Optional[str] = None
    observation: Optional[str] = None
    # Enriched profile
    research_areas: Optional[list[str]] = None
    year_joined: Optional[int] = None
    bio: Optional[str] = None
    bioPt: Optional[str] = None
    skills: Optional[list[str]] = None
    graduation_year: Optional[int] = None
    # Social links
    linkedin: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    researchgate: Optional[str] = None
    # USP
    usp_number: Optional[str] = None
    # LGPD
    lgpd_consent: Optional[bool] = None


class BootstrapAdmin(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    identifier: str   # email or USP number
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LgpdDeletionRequest(BaseModel):
    reason: Optional[str] = None


class LgpdRequestOut(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    request_type: str    # "export" | "deletion"
    status: str          # "pending" | "completed" | "rejected"
    reason: Optional[str] = None
    created_at: str
    resolved_at: Optional[str] = None
