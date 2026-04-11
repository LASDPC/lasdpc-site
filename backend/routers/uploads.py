import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from core.dependencies import get_current_user

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png"}
MAX_SIZE = 2 * 1024 * 1024  # 2 MB


@router.post("")
async def upload_file(file: UploadFile, _user: dict = Depends(get_current_user)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG/PNG images are allowed",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be under 2 MB",
        )

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = UPLOAD_DIR / filename
    path.write_bytes(contents)

    return {"url": f"/uploads/{filename}"}
