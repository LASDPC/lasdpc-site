from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


class RoomEventParticipant(BaseModel):
    """
    Participant can be a matched platform user (user_id present) and/or an external email.
    """

    user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    initials: Optional[str] = None
    photo: Optional[str] = None
    avatar: Optional[str] = None
    usp_number: Optional[str] = None


class RoomEventCreate(BaseModel):
    room: Literal["1-009", "1-007"]
    title: str
    start_time: datetime
    end_time: datetime
    participants: list[str] = []


class RoomEventParticipantsUpdate(BaseModel):
    participants: list[str] = []


class RoomEventUpdate(BaseModel):
    title: Optional[str] = None
    participants: Optional[list[str]] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class RoomEventOut(BaseModel):
    id: str
    room: str
    title: str
    start_time: datetime
    end_time: datetime
    user_id: str
    user_name: str
    created_at: datetime
    participants: list[RoomEventParticipant] = []
