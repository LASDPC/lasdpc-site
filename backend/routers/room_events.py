import re
from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from core.database import get_db
from core.dependencies import get_current_user
from models.room_event import (
    RoomEventCreate,
    RoomEventOut,
    RoomEventParticipant,
    RoomEventParticipantsUpdate,
)

router = APIRouter()

ROOM_EVENTS_TTL_DAYS = 30


def _to_out(doc: dict) -> RoomEventOut:
    return RoomEventOut(
        id=str(doc["_id"]),
        room=doc["room"],
        title=doc["title"],
        start_time=doc["start_time"],
        end_time=doc["end_time"],
        user_id=doc["user_id"],
        user_name=doc["user_name"],
        created_at=doc["created_at"],
        participants=[RoomEventParticipant(**p) for p in doc.get("participants", [])],
    )


def _normalize_identifier(s: str) -> str:
    return s.strip()


def _is_email(s: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", s))


async def _resolve_participants(db, identifiers: list[str]) -> list[dict]:
    """
    Resolve participant identifiers (email or username-like) into stored participant dicts.
    - Try exact email match (case-insensitive)
    - Else try exact name match (case-insensitive) as a proxy for "username"
    - Else store as external email if it looks like one
    Deduplicate by user_id and email.
    """
    out: list[dict] = []
    seen_user_ids: set[str] = set()
    seen_emails: set[str] = set()

    for raw in identifiers or []:
        ident = _normalize_identifier(raw)
        if not ident:
            continue

        user_doc = None
        if _is_email(ident):
            user_doc = await db.users.find_one({"email": {"$regex": f"^{re.escape(ident)}$", "$options": "i"}})
        if not user_doc:
            user_doc = await db.users.find_one({"name": {"$regex": f"^{re.escape(ident)}$", "$options": "i"}})

        if user_doc:
            uid = str(user_doc["_id"])
            if uid in seen_user_ids:
                continue
            seen_user_ids.add(uid)
            email_val = user_doc.get("email")
            if email_val:
                seen_emails.add(str(email_val).lower())
            out.append(
                {
                    "user_id": uid,
                    "name": user_doc.get("name"),
                    "email": email_val,
                }
            )
            continue

        if _is_email(ident):
            email_lower = ident.lower()
            if email_lower in seen_emails:
                continue
            seen_emails.add(email_lower)
            out.append({"email": ident})

    return out


@router.get("", response_model=list[RoomEventOut])
async def list_events(
    room: str = Query(...),
    start: datetime = Query(...),
    end: datetime = Query(...),
    _user: dict = Depends(get_current_user),
):
    db = get_db()
    cursor = db.room_events.find({
        "room": room,
        "start_time": {"$lt": end},
        "end_time": {"$gt": start},
    })
    docs = await cursor.to_list(1000)
    return [_to_out(d) for d in docs]


@router.post("", response_model=RoomEventOut, status_code=status.HTTP_201_CREATED)
async def create_event(body: RoomEventCreate, user: dict = Depends(get_current_user)):
    if body.end_time <= body.start_time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_time must be after start_time")

    db = get_db()

    overlap = await db.room_events.find_one({
        "room": body.room,
        "start_time": {"$lt": body.end_time},
        "end_time": {"$gt": body.start_time},
    })
    if overlap:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Time conflict with another event.")

    participants = await _resolve_participants(db, body.participants)

    expires_at = body.end_time + timedelta(days=ROOM_EVENTS_TTL_DAYS)
    if expires_at <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event would be expired by retention policy",
        )

    doc = {
        "room": body.room,
        "title": body.title,
        "start_time": body.start_time,
        "end_time": body.end_time,
        "user_id": str(user["_id"]),
        "user_name": user["name"],
        "created_at": datetime.utcnow(),
        "expires_at": expires_at,
        "participants": participants,
    }
    result = await db.room_events.insert_one(doc)
    doc["_id"] = result.inserted_id

    await db.room_events.create_index("expires_at", expireAfterSeconds=0)

    return _to_out(doc)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(event_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        oid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid event id")

    doc = await db.room_events.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if str(doc.get("user_id")) != str(user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own events")
    await db.room_events.delete_one({"_id": oid})


@router.patch("/{event_id}/participants", response_model=RoomEventOut)
async def update_participants(event_id: str, body: RoomEventParticipantsUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        oid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid event id")

    doc = await db.room_events.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if str(doc.get("user_id")) != str(user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own events")

    participants = await _resolve_participants(db, body.participants)
    await db.room_events.update_one({"_id": oid}, {"$set": {"participants": participants}})
    doc["participants"] = participants
    return _to_out(doc)
