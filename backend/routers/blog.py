import re
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from core.database import get_db
from core.dependencies import require_admin
from models.blog import BlogPostCreate, BlogPostUpdate, BlogPostOut

router = APIRouter()

SEARCH_FIELDS = ("title", "titlePt", "excerpt", "excerptPt", "content", "contentPt", "tag", "author", "date")


def _to_out(doc: dict) -> BlogPostOut:
    return BlogPostOut(id=str(doc["_id"]), **{k: doc[k] for k in BlogPostOut.model_fields if k != "id" and k in doc})


def _regex_filter(value: str) -> dict:
    return {"$regex": re.escape(value.strip()), "$options": "i"}


def _build_filter(q: Optional[str], tag: Optional[str], year: Optional[str], author: Optional[str]) -> dict:
    filters: dict = {}
    if q and q.strip():
        query = _regex_filter(q)
        filters["$or"] = [{field: query} for field in SEARCH_FIELDS]
    if tag and tag.strip():
        filters["tag"] = _regex_filter(tag)
    if year and year.strip():
        filters["date"] = _regex_filter(year)
    if author and author.strip():
        filters["author"] = _regex_filter(author)
    return filters


@router.get("", response_model=list[BlogPostOut])
async def list_posts(
    q: Optional[str] = Query(default=None),
    tag: Optional[str] = Query(default=None),
    year: Optional[str] = Query(default=None),
    author: Optional[str] = Query(default=None),
):
    db = get_db()
    items = await db.blog_posts.find(_build_filter(q, tag, year, author)).to_list(1000)
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
