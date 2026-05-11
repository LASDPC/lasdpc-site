from typing import Literal, Optional

from pydantic import BaseModel


ProfileTermKind = Literal["research_area", "skill", "affiliation"]
LabRelationshipType = Literal["academic_advisor", "usp_organization", "external_organization"]


class ProfileTermOut(BaseModel):
    id: str
    kind: ProfileTermKind
    value: str
    relationship_type: Optional[LabRelationshipType] = None
