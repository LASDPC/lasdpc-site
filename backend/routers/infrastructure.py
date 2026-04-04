from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_db
from core.dependencies import require_admin
from models.infrastructure import ClusterCreate, ClusterUpdate, ClusterOut

router = APIRouter()


def _to_out(doc: dict) -> ClusterOut:
    return ClusterOut(id=str(doc["_id"]), **{k: doc[k] for k in ClusterOut.model_fields if k != "id" and k in doc})


@router.get("")
async def get_infrastructure():
    db = get_db()
    clusters = await db.clusters.find().to_list(1000)
    resources = [c["name"] for c in clusters]
    return {"clusters": [_to_out(c) for c in clusters], "resources": resources}


@router.get("/{item_id}", response_model=ClusterOut)
async def get_cluster(item_id: str):
    db = get_db()
    doc = await db.clusters.find_one({"_id": ObjectId(item_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cluster not found")
    return _to_out(doc)


@router.post("", response_model=ClusterOut, status_code=status.HTTP_201_CREATED)
async def create_cluster(body: ClusterCreate, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.clusters.insert_one(body.model_dump())
    doc = await db.clusters.find_one({"_id": result.inserted_id})
    return _to_out(doc)


@router.put("/{item_id}", response_model=ClusterOut)
async def update_cluster(item_id: str, body: ClusterUpdate, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.clusters.update_one({"_id": ObjectId(item_id)}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cluster not found")
    doc = await db.clusters.find_one({"_id": ObjectId(item_id)})
    return _to_out(doc)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cluster(item_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.clusters.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cluster not found")
