from datetime import datetime

from pydantic import BaseModel, Field


class RoomCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)


class RoomOut(BaseModel):
    id: str
    name: str
    created_at: datetime
