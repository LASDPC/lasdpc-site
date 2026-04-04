from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_db
from core.dependencies import require_admin
from models.person import (
    DocenteCreate, DocenteUpdate, DocenteOut,
    StudentCreate, StudentUpdate, StudentOut,
)

router = APIRouter()


def _docente_out(doc: dict) -> DocenteOut:
    return DocenteOut(id=str(doc["_id"]), **{k: doc[k] for k in DocenteOut.model_fields if k != "id" and k in doc})


def _student_out(doc: dict) -> StudentOut:
    return StudentOut(id=str(doc["_id"]), **{k: doc[k] for k in StudentOut.model_fields if k != "id" and k in doc})


# --- Docentes ---
@router.get("/docentes", response_model=list[DocenteOut])
async def list_docentes():
    db = get_db()
    items = await db.docentes.find().to_list(1000)
    return [_docente_out(d) for d in items]


@router.get("/docentes/{item_id}", response_model=DocenteOut)
async def get_docente(item_id: str):
    db = get_db()
    doc = await db.docentes.find_one({"_id": ObjectId(item_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Docente not found")
    return _docente_out(doc)


@router.post("/docentes", response_model=DocenteOut, status_code=status.HTTP_201_CREATED)
async def create_docente(body: DocenteCreate, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.docentes.insert_one(body.model_dump())
    doc = await db.docentes.find_one({"_id": result.inserted_id})
    return _docente_out(doc)


@router.put("/docentes/{item_id}", response_model=DocenteOut)
async def update_docente(item_id: str, body: DocenteUpdate, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.docentes.update_one({"_id": ObjectId(item_id)}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Docente not found")
    doc = await db.docentes.find_one({"_id": ObjectId(item_id)})
    return _docente_out(doc)


@router.delete("/docentes/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_docente(item_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.docentes.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Docente not found")


# --- Students ---
@router.get("/students", response_model=list[StudentOut])
async def list_students():
    db = get_db()
    items = await db.students.find().to_list(1000)
    return [_student_out(d) for d in items]


@router.get("/students/{item_id}", response_model=StudentOut)
async def get_student(item_id: str):
    db = get_db()
    doc = await db.students.find_one({"_id": ObjectId(item_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return _student_out(doc)


@router.post("/students", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
async def create_student(body: StudentCreate, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.students.insert_one(body.model_dump())
    doc = await db.students.find_one({"_id": result.inserted_id})
    return _student_out(doc)


@router.put("/students/{item_id}", response_model=StudentOut)
async def update_student(item_id: str, body: StudentUpdate, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.students.update_one({"_id": ObjectId(item_id)}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    doc = await db.students.find_one({"_id": ObjectId(item_id)})
    return _student_out(doc)


@router.delete("/students/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(item_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.students.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
