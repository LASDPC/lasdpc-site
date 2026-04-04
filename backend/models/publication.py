from pydantic import BaseModel


class PublicationBase(BaseModel):
    title: str
    titlePt: str
    authors: str
    venue: str
    year: int
    doi: str


class PublicationCreate(PublicationBase):
    pass


class PublicationUpdate(PublicationBase):
    pass


class PublicationOut(PublicationBase):
    id: str
