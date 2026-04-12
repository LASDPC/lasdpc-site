from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_db
from core.dependencies import get_current_user

router = APIRouter()


@router.get("")
async def my_notifications(user: dict = Depends(get_current_user)):
    db = get_db()
    items = await db.notifications.find({"user_id": user["_id"]}).sort("created_at", -1).to_list(100)
    return [
        {
            "id": str(n["_id"]),
            "type": n["type"],
            "cluster_name": n.get("cluster_name", ""),
            "start_date": n.get("start_date", ""),
            "end_date": n.get("end_date", ""),
            "created_at": n.get("created_at", ""),
        }
        for n in items
    ]


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def dismiss_notification(notification_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.notifications.delete_one({
        "_id": ObjectId(notification_id),
        "user_id": user["_id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
