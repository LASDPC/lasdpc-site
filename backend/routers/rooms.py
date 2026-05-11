from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_db
from core.dependencies import get_current_user, require_admin
from core.profile_terms import normalize_text
from models.room import RoomCreate, RoomOut

router = APIRouter()

DEFAULT_ROOMS = ("1-009", "1-007")
ROOMS_INITIALIZED_KEY = "rooms_initialized"


def _room_out(doc: dict) -> RoomOut:
    return RoomOut(id=str(doc["_id"]), name=doc["name"], created_at=doc["created_at"])


def _clean_room_name(name: str) -> str:
    return " ".join(name.strip().split())


async def initialize_default_rooms(db) -> None:
    await db.rooms.create_index("normalized_name", unique=True)
    settings_doc = await db.app_settings.find_one({"key": ROOMS_INITIALIZED_KEY})
    if settings_doc:
        return

    now = datetime.utcnow()
    for name in DEFAULT_ROOMS:
        await db.rooms.update_one(
            {"normalized_name": normalize_text(name)},
            {
                "$setOnInsert": {
                    "name": name,
                    "normalized_name": normalize_text(name),
                    "created_at": now,
                }
            },
            upsert=True,
        )
    await db.app_settings.update_one(
        {"key": ROOMS_INITIALIZED_KEY},
        {"$set": {"key": ROOMS_INITIALIZED_KEY, "value": True, "created_at": now}},
        upsert=True,
    )


@router.get("", response_model=list[RoomOut])
async def list_rooms(_user: dict = Depends(get_current_user)):
    db = get_db()
    items = await db.rooms.find({}).sort("name", 1).to_list(1000)
    return [_room_out(d) for d in items]


@router.post("", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
async def create_room(body: RoomCreate, _admin: dict = Depends(require_admin)):
    db = get_db()
    name = _clean_room_name(body.name)
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room name is required")
    normalized_name = normalize_text(name)
    existing = await db.rooms.find_one({"normalized_name": normalized_name})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Room already exists")

    doc = {"name": name, "normalized_name": normalized_name, "created_at": datetime.utcnow()}
    result = await db.rooms.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _room_out(doc)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(room_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    try:
        oid = ObjectId(room_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid room id")

    room = await db.rooms.find_one({"_id": oid})
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    active_or_future_event = await db.room_events.find_one({
        "room": room["name"],
        "end_time": {"$gte": datetime.utcnow()},
    })
    if active_or_future_event:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Room has active or future reservations",
        )

    await db.rooms.delete_one({"_id": oid})
