from pydantic import BaseModel


class DocBase(BaseModel):
    category: str
    title: str
    titlePt: str
    content: str
    contentPt: str
    updatedAt: str


class DocCreate(DocBase):
    pass


class DocUpdate(DocBase):
    pass


class DocOut(DocBase):
    id: str
