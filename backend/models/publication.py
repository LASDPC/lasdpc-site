from typing import Optional
from pydantic import BaseModel


class PublicationBase(BaseModel):
    title: str
    titlePt: str
    authors: str
    venue: str
    year: int
    doi: str
    # New filterable fields (mirror project metadata so the research page can
    # offer the same kind of faceted search across both resources).
    tags: list[str] = []
    type: str = "article"            # article | conference | journal | book | chapter | thesis | preprint | other
    status: str = "published"        # published | preprint | under-review | in-press
    impact: str = "Medium"           # High | Medium | Low
    area: Optional[str] = None       # primary research area (free text)
    areaPt: Optional[str] = None     # PT version (kept consistent with the bilingual model)


class PublicationCreate(PublicationBase):
    pass


class PublicationUpdate(PublicationBase):
    pass


class PublicationOut(PublicationBase):
    id: str
