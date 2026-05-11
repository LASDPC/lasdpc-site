from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool

from core.dependencies import get_current_user, require_admin
from core.storage import ALLOWED_MIME, build_key, put_object_stream

router = APIRouter()

MAX_SIZE = 2 * 1024 * 1024  # 2 MB


async def _enforce_size(file: UploadFile) -> None:
    # Lê em chunks; aborta cedo se passar do limite, sem carregar o arquivo inteiro na RAM
    # antes de checar. Após validar, retorna o cursor pro início para o upload.
    total = 0
    chunk_size = 64 * 1024
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be under 2 MB",
            )
    await file.seek(0)


async def _store_upload(file: UploadFile, prefix: str) -> dict:
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG or WebP images are allowed",
        )
    await _enforce_size(file)
    key = build_key(prefix, file.content_type)
    await run_in_threadpool(put_object_stream, key, file.file, file.content_type)
    return {"key": key}


@router.post("")
async def upload_file(file: UploadFile, _user: dict = Depends(get_current_user)):
    """Upload de foto de perfil de usuário autenticado."""
    return await _store_upload(file, prefix="profile")


@router.post("/public")
async def upload_public_registration_photo(file: UploadFile):
    """Upload público usado durante o fluxo de registro (sem JWT ainda)."""
    return await _store_upload(file, prefix="profile")


@router.post("/{prefix}")
async def upload_with_prefix(
    prefix: Literal["blog", "markdown"],
    file: UploadFile,
    _admin: dict = Depends(require_admin),
):
    """Upload admin-only para covers de blog e imagens inline no markdown."""
    return await _store_upload(file, prefix=prefix)
