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


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ProjectBase):
    pass


class ProjectOut(ProjectBase):
    id: str
