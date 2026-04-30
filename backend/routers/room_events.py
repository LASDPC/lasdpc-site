from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from core.database import get_db
from core.dependencies import get_current_user
from models.room_event import RoomEventCreate, RoomEventOut

router = APIRouter()


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
    )


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

    doc = {
        "room": body.room,
        "title": body.title,
        "start_time": body.start_time,
        "end_time": body.end_time,
        "user_id": user["_id"],
        "user_name": user["name"],
        "created_at": datetime.utcnow(),
        "expires_at": body.end_time + timedelta(hours=2),
    }
    result = await db.room_events.insert_one(doc)
    doc["_id"] = result.inserted_id

    await db.room_events.create_index("expires_at", expireAfterSeconds=0)

    return _to_out(doc)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(event_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.room_events.find_one({"_id": ObjectId(event_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if doc["user_id"] != user["_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own events")
    await db.room_events.delete_one({"_id": ObjectId(event_id)})
