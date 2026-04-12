from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_db
from core.dependencies import require_admin
from models.user import UserCreate, UserUpdate, UserOut

router = APIRouter()


def _user_out(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        **{k: doc.get(k) for k in UserOut.model_fields if k != "id" and k in doc},
    )


# --- Docentes (role=docente) ---
@router.get("/docentes", response_model=list[UserOut])
async def list_docentes():
    db = get_db()
    items = await db.users.find({"role": "docente", "status": {"$ne": "pending"}}).to_list(1000)
    return [_user_out(d) for d in items]


@router.get("/docentes/{item_id}", response_model=UserOut)
async def get_docente(item_id: str):
    db = get_db()
    doc = await db.users.find_one({"_id": ObjectId(item_id), "role": "docente"})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Docente not found")
    return _user_out(doc)


# --- Students (role=aluno_ativo) ---
@router.get("/students", response_model=list[UserOut])
async def list_students():
    db = get_db()
    items = await db.users.find({"role": {"$in": ["aluno_ativo", "alumni"]}, "status": {"$ne": "pending"}}).to_list(1000)
    return [_user_out(d) for d in items]


@router.get("/students/{item_id}", response_model=UserOut)
async def get_student(item_id: str):
    db = get_db()
    doc = await db.users.find_one({"_id": ObjectId(item_id), "role": {"$in": ["aluno_ativo", "alumni"]}})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return _user_out(doc)
