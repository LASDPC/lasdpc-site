from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_db
from core.dependencies import get_current_user, require_admin
from models.doc import DocCreate, DocUpdate, DocOut

router = APIRouter()


def _to_out(doc: dict) -> DocOut:
    return DocOut(id=str(doc["_id"]), **{k: doc[k] for k in DocOut.model_fields if k != "id" and k in doc})


@router.get("", response_model=list[DocOut])
async def list_docs(_user: dict = Depends(get_current_user)):
    db = get_db()
    items = await db.docs.find().to_list(1000)
    return [_to_out(d) for d in items]


@router.get("/{item_id}", response_model=DocOut)
async def get_doc(item_id: str, _user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.docs.find_one({"_id": ObjectId(item_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doc not found")
    return _to_out(doc)


@router.post("", response_model=DocOut, status_code=status.HTTP_201_CREATED)
async def create_doc(body: DocCreate, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.docs.insert_one(body.model_dump())
    doc = await db.docs.find_one({"_id": result.inserted_id})
    return _to_out(doc)


@router.put("/{item_id}", response_model=DocOut)
async def update_doc(item_id: str, body: DocUpdate, _user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.docs.update_one({"_id": ObjectId(item_id)}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doc not found")
    doc = await db.docs.find_one({"_id": ObjectId(item_id)})
    return _to_out(doc)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doc(item_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.docs.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doc not found")
