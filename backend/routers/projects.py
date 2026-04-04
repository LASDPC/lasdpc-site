from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_db
from core.dependencies import require_admin
from models.project import ProjectCreate, ProjectUpdate, ProjectOut

router = APIRouter()


def _to_out(doc: dict) -> ProjectOut:
    return ProjectOut(id=str(doc["_id"]), **{k: doc[k] for k in ProjectOut.model_fields if k != "id" and k in doc})


@router.get("", response_model=list[ProjectOut])
async def list_projects():
    db = get_db()
    items = await db.projects.find().to_list(1000)
    return [_to_out(d) for d in items]


@router.get("/{item_id}", response_model=ProjectOut)
async def get_project(item_id: str):
    db = get_db()
    doc = await db.projects.find_one({"_id": ObjectId(item_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return _to_out(doc)


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(body: ProjectCreate, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.projects.insert_one(body.model_dump())
    doc = await db.projects.find_one({"_id": result.inserted_id})
    return _to_out(doc)


@router.put("/{item_id}", response_model=ProjectOut)
async def update_project(item_id: str, body: ProjectUpdate, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.projects.update_one({"_id": ObjectId(item_id)}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    doc = await db.projects.find_one({"_id": ObjectId(item_id)})
    return _to_out(doc)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(item_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.projects.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
