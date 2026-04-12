from typing import Optional
from pydantic import BaseModel


class CustomFieldDef(BaseModel):
    name: str                # internal key
    label: str               # display label (EN)
    labelPt: str             # display label (PT)
    type: str = "text"       # text | number | select | checkbox | date
    options: list[str] = []  # for select type
    required: bool = False


class ClusterBase(BaseModel):
    name: str
    description: str
    descriptionPt: str
    cpuUsage: int = 0
    gpuUsage: int = 0
    memoryUsage: int = 0
    storageUsage: int = 0
    status: str = "online"
    custom_fields: list[CustomFieldDef] = []


class ClusterCreate(ClusterBase):
    pass


class ClusterUpdate(ClusterBase):
    pass


class ClusterOut(ClusterBase):
    id: str
