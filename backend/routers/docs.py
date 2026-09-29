import re

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_db
from core.dependencies import get_current_user, require_admin
from models.doc import DocCreate, DocUpdate, DocOut, FolderCreate, FolderOut

router = APIRouter()


def _to_out(doc: dict) -> DocOut:
    return DocOut(id=str(doc["_id"]), **{k: doc[k] for k in DocOut.model_fields if k != "id" and k in doc})


async def _ensure_path_free(db, path: str, exclude_id: ObjectId | None = None):
    query: dict = {"path": path}
    if exclude_id is not None:
        query["_id"] = {"$ne": exclude_id}
    if await db.docs.find_one(query):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A doc with this path already exists")
    if await db.doc_folders.find_one({"path": path}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A folder with this path already exists")


@router.get("/folders", response_model=list[FolderOut])
async def list_folders(_user: dict = Depends(get_current_user)):
    db = get_db()
    items = await db.doc_folders.find().sort("path", 1).to_list(1000)
    return [FolderOut(id=str(item["_id"]), path=item["path"]) for item in items]


@router.post("/folders", response_model=FolderOut, status_code=status.HTTP_201_CREATED)
async def create_folder(body: FolderCreate, _admin: dict = Depends(require_admin)):
    db = get_db()
    path = body.path
    if (await db.doc_folders.find_one({"path": path})
            or await db.doc_folders.find_one({"path": {"$regex": f"^{re.escape(path)}/"}})
            or await db.docs.find_one({"path": {"$regex": f"^{re.escape(path)}/"}})):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Folder already exists")
    if await db.docs.find_one({"path": path}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A doc with this path already exists")
    result = await db.doc_folders.insert_one({"path": path})
    return FolderOut(id=str(result.inserted_id), path=path)


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(folder_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    try:
        oid = ObjectId(folder_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found") from None
    folder = await db.doc_folders.find_one({"_id": oid})
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    descendants = {"$regex": f"^{re.escape(folder['path'])}/"}
    if await db.docs.find_one({"path": descendants}) or await db.doc_folders.find_one({"path": descendants}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Folder is not empty")
    await db.doc_folders.delete_one({"_id": oid})


@router.get("", response_model=list[DocOut])
async def list_docs(_user: dict = Depends(get_current_user)):
    db = get_db()
    # Legacy docs (pre path-based model) are excluded rather than breaking the list.
    items = await db.docs.find({"path": {"$exists": True}}).sort("path", 1).to_list(1000)
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
    await _ensure_path_free(db, body.path)
    result = await db.docs.insert_one(body.model_dump())
    doc = await db.docs.find_one({"_id": result.inserted_id})
    return _to_out(doc)


@router.put("/{item_id}", response_model=DocOut)
async def update_doc(item_id: str, body: DocUpdate, _user: dict = Depends(get_current_user)):
    db = get_db()
    oid = ObjectId(item_id)
    await _ensure_path_free(db, body.path, exclude_id=oid)
    result = await db.docs.update_one({"_id": oid}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doc not found")
    doc = await db.docs.find_one({"_id": oid})
    return _to_out(doc)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doc(item_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.docs.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doc not found")
