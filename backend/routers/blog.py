from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_db
from core.dependencies import require_admin
from models.blog import BlogPostCreate, BlogPostUpdate, BlogPostOut

router = APIRouter()


def _to_out(doc: dict) -> BlogPostOut:
    return BlogPostOut(id=str(doc["_id"]), **{k: doc[k] for k in BlogPostOut.model_fields if k != "id" and k in doc})


@router.get("", response_model=list[BlogPostOut])
async def list_posts():
    db = get_db()
    items = await db.blog_posts.find().to_list(1000)
    return [_to_out(d) for d in items]


@router.get("/{item_id}", response_model=BlogPostOut)
async def get_post(item_id: str):
    db = get_db()
    doc = await db.blog_posts.find_one({"_id": ObjectId(item_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")
    return _to_out(doc)


@router.post("", response_model=BlogPostOut, status_code=status.HTTP_201_CREATED)
async def create_post(body: BlogPostCreate, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.blog_posts.insert_one(body.model_dump())
    doc = await db.blog_posts.find_one({"_id": result.inserted_id})
    return _to_out(doc)


@router.put("/{item_id}", response_model=BlogPostOut)
async def update_post(item_id: str, body: BlogPostUpdate, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.blog_posts.update_one({"_id": ObjectId(item_id)}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")
    doc = await db.blog_posts.find_one({"_id": ObjectId(item_id)})
    return _to_out(doc)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(item_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.blog_posts.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")
