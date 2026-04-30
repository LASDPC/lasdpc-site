import re
from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from core.database import get_db
from core.dependencies import get_current_user, require_admin
from models.room_event import (
    RoomEventCreate,
    RoomEventOut,
    RoomEventParticipant,
    RoomEventParticipantsUpdate,
    RoomEventUpdate,
)

router = APIRouter()

ROOM_EVENTS_TTL_DAYS = 30
ACTIVE_USER_QUERY = {"status": {"$nin": ["pending", "rejected"]}}


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


def _participant_from_user(user_doc: dict) -> dict:
    return {
        "user_id": str(user_doc["_id"]),
        "name": user_doc.get("name"),
        "email": user_doc.get("email"),
        "initials": user_doc.get("initials"),
        "photo": user_doc.get("photo"),
        "avatar": user_doc.get("avatar"),
        "usp_number": user_doc.get("usp_number"),
    }


async def _resolve_participants(db, identifiers: list[str]) -> list[dict]:
    """
    Resolve participant identifiers into stored participant dicts.
    Registered users can be selected by user:<id>, ObjectId, email, exact name, or USP number.
    External participants are stored only when the identifier is an email address.
    - Try exact email match (case-insensitive)
    - Else try exact name match (case-insensitive)
    - Else try exact USP number match (case-insensitive)
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
        if ident.startswith("user:"):
            user_id = ident.removeprefix("user:").strip()
            if ObjectId.is_valid(user_id):
                user_doc = await db.users.find_one({"_id": ObjectId(user_id), **ACTIVE_USER_QUERY})
        elif ObjectId.is_valid(ident):
            user_doc = await db.users.find_one({"_id": ObjectId(ident), **ACTIVE_USER_QUERY})

        if not user_doc and _is_email(ident):
            user_doc = await db.users.find_one({"email": {"$regex": f"^{re.escape(ident)}$", "$options": "i"}, **ACTIVE_USER_QUERY})
        if not user_doc:
            user_doc = await db.users.find_one({"name": {"$regex": f"^{re.escape(ident)}$", "$options": "i"}, **ACTIVE_USER_QUERY})
        if not user_doc:
            user_doc = await db.users.find_one({"usp_number": {"$regex": f"^{re.escape(ident)}$", "$options": "i"}, **ACTIVE_USER_QUERY})

        if user_doc:
            uid = str(user_doc["_id"])
            if uid in seen_user_ids:
                continue
            seen_user_ids.add(uid)
            email_val = user_doc.get("email")
            if email_val:
                seen_emails.add(str(email_val).lower())
            out.append(_participant_from_user(user_doc))
            continue

        if _is_email(ident):
            email_lower = ident.lower()
            if email_lower in seen_emails:
                continue
            seen_emails.add(email_lower)
            out.append({"email": ident})

    return out


def _participant_user_ids(participants: list[dict]) -> set[str]:
    return {str(p.get("user_id")) for p in participants if p.get("user_id")}


async def _notify_registered_participants(
    db,
    event_doc: dict,
    actor_user_id: str,
    previous_user_ids: set[str] | None = None,
) -> None:
    previous_user_ids = previous_user_ids or set()
    now = datetime.utcnow()
    notifications = []

    for participant in event_doc.get("participants", []):
        user_id = participant.get("user_id")
        if not user_id:
            continue
        user_id_str = str(user_id)
        if user_id_str == str(actor_user_id) or user_id_str in previous_user_ids:
            continue
        if not ObjectId.is_valid(user_id_str):
            continue

        notifications.append({
            "user_id": ObjectId(user_id_str),
            "type": "room_event_invite",
            "event_id": str(event_doc["_id"]),
            "room": event_doc.get("room", ""),
            "event_title": event_doc.get("title", ""),
            "start_time": event_doc.get("start_time"),
            "end_time": event_doc.get("end_time"),
            "actor_name": event_doc.get("user_name", ""),
            "created_at": now,
        })

    if notifications:
        await db.notifications.insert_many(notifications)


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


@router.get("/admin", response_model=list[RoomEventOut])
async def list_admin_events(
    start: datetime = Query(...),
    end: datetime = Query(...),
    room: str | None = Query(default=None),
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    query: dict = {
        "start_time": {"$lt": end},
        "end_time": {"$gt": start},
    }
    if room:
        query["room"] = room
    cursor = db.room_events.find(query).sort("start_time", 1)
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
    await _notify_registered_participants(db, doc, str(user["_id"]))

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
    if str(doc.get("user_id")) != str(user["_id"]) and not user.get("is_admin"):
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
    if str(doc.get("user_id")) != str(user["_id"]) and not user.get("is_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own events")

    previous_user_ids = _participant_user_ids(doc.get("participants", []))
    participants = await _resolve_participants(db, body.participants)
    await db.room_events.update_one({"_id": oid}, {"$set": {"participants": participants}})
    doc["participants"] = participants
    await _notify_registered_participants(db, doc, str(user["_id"]), previous_user_ids)
    return _to_out(doc)


@router.patch("/{event_id}", response_model=RoomEventOut)
async def update_event(event_id: str, body: RoomEventUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        oid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid event id")

    doc = await db.room_events.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if str(doc.get("user_id")) != str(user["_id"]) and not user.get("is_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own events")

    update: dict = {}

    # Time updates are validated together (end > start, no overlap) and update TTL expiration.
    doc_start = doc.get("start_time")
    doc_end = doc.get("end_time")
    new_start = body.start_time if body.start_time is not None else doc_start
    new_end = body.end_time if body.end_time is not None else doc_end
    time_changed = body.start_time is not None or body.end_time is not None

    if body.title is not None:
        title = body.title.strip()
        if not title:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="title must not be empty")
        update["title"] = title
        doc["title"] = title

    if body.participants is not None:
        previous_user_ids = _participant_user_ids(doc.get("participants", []))
        participants = await _resolve_participants(db, body.participants)
        update["participants"] = participants
        doc["participants"] = participants

    if time_changed:
        if new_start is None or new_end is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_time and end_time are required")
        if new_end <= new_start:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_time must be after start_time")

        overlap = await db.room_events.find_one(
            {
                "_id": {"$ne": oid},
                "room": doc.get("room"),
                "start_time": {"$lt": new_end},
                "end_time": {"$gt": new_start},
            }
        )
        if overlap:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Time conflict with another event.")

        expires_at = new_end + timedelta(days=ROOM_EVENTS_TTL_DAYS)
        if expires_at <= datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event would be expired by retention policy",
            )

        update["start_time"] = new_start
        update["end_time"] = new_end
        update["expires_at"] = expires_at
        doc["start_time"] = new_start
        doc["end_time"] = new_end
        doc["expires_at"] = expires_at

    if not update:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nothing to update")

    await db.room_events.update_one({"_id": oid}, {"$set": update})
    if body.participants is not None:
        await _notify_registered_participants(db, doc, str(user["_id"]), previous_user_ids)
    return _to_out(doc)
