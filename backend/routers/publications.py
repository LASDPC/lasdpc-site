from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_db
from core.dependencies import require_admin
from models.publication import PublicationCreate, PublicationUpdate, PublicationOut

router = APIRouter()


def _to_out(doc: dict) -> PublicationOut:
    return PublicationOut(id=str(doc["_id"]), **{k: doc[k] for k in PublicationOut.model_fields if k != "id" and k in doc})


@router.get("", response_model=list[PublicationOut])
async def list_publications():
    db = get_db()
    items = await db.publications.find().to_list(1000)
    return [_to_out(d) for d in items]


@router.get("/{item_id}", response_model=PublicationOut)
async def get_publication(item_id: str):
    db = get_db()
    doc = await db.publications.find_one({"_id": ObjectId(item_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")
    return _to_out(doc)


@router.post("", response_model=PublicationOut, status_code=status.HTTP_201_CREATED)
async def create_publication(body: PublicationCreate, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.publications.insert_one(body.model_dump())
    doc = await db.publications.find_one({"_id": result.inserted_id})
    return _to_out(doc)


@router.put("/{item_id}", response_model=PublicationOut)
async def update_publication(item_id: str, body: PublicationUpdate, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.publications.update_one({"_id": ObjectId(item_id)}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")
    doc = await db.publications.find_one({"_id": ObjectId(item_id)})
    return _to_out(doc)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_publication(item_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.publications.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")
