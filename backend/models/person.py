from pydantic import BaseModel


class DocenteBase(BaseModel):
    name: str
    role: str
    rolePt: str
    area: str
    areaPt: str
    email: str
    lattes: str | None = None
    orcid: str | None = None
    scholar: str | None = None
    page: str | None = None
    photo: str | None = None


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
