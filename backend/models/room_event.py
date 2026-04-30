from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class RoomEventCreate(BaseModel):
    room: Literal["1-009", "1-007"]
    title: str
    start_time: datetime
    end_time: datetime


class RoomEventOut(BaseModel):
    id: str
    room: str
    title: str
    start_time: datetime
    end_time: datetime
    user_id: str
    user_name: str
    created_at: datetime
