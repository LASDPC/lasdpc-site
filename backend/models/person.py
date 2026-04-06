from typing import Optional

from pydantic import BaseModel


class DocenteBase(BaseModel):
    name: str
    role: str
    rolePt: str
    area: str
    areaPt: str
    email: str
    lattes: Optional[str] = None
    orcid: Optional[str] = None
    scholar: Optional[str] = None
    page: Optional[str] = None
    photo: Optional[str] = None


class DocenteCreate(DocenteBase):
    pass


class DocenteUpdate(DocenteBase):
    pass


class DocenteOut(DocenteBase):
    id: str


class StudentBase(BaseModel):
    name: str
    level: str
    levelPt: str
    area: str
    areaPt: str


class StudentCreate(StudentBase):
    pass


class StudentUpdate(StudentBase):
    pass


class StudentOut(StudentBase):
    id: str
