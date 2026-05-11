from typing import Optional
from pydantic import BaseModel


class ProjectBase(BaseModel):
    title: str
    titlePt: str
    description: str
    descriptionPt: str
    content: str
    contentPt: str
    status: str = "active"
    tags: list[str] = []
    publications: int = 0
    impact: str = "Medium"
    image: Optional[str] = None
    gallery: list[str] = []
    website: Optional[str] = None
    github: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ProjectBase):
    pass


class ProjectOut(ProjectBase):
    id: str
