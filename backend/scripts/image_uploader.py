"""Helpers to upload local image files to MinIO during the seed.

Reuses the storage primitives in `backend/core/storage.py` so behaviour stays
consistent with runtime uploads done by the API.
"""

from __future__ import annotations

import mimetypes
from pathlib import Path

from core.storage import ALLOWED_MIME, build_key, put_object_stream


def guess_mime(path: Path) -> str:
    mime, _ = mimetypes.guess_type(path.name)
    if mime in ALLOWED_MIME:
        return mime
    # Fallback by extension (mimetypes can be inconsistent across systems)
    ext = path.suffix.lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }.get(ext, "image/png")


def upload_local_image(path: Path, prefix: str) -> str:
    """Upload `path` to MinIO under `prefix/...` and return the object key."""
    mime = guess_mime(path)
    key = build_key(prefix, mime)
    with path.open("rb") as f:
        put_object_stream(key, f, mime)
    return key


def ensure_bucket() -> None:
    """Create the MinIO bucket if it does not exist (idempotent)."""
    from core.storage import _s3
    from core.config import settings

    bucket = settings.minio_bucket
    try:
        _s3.head_bucket(Bucket=bucket)
    except Exception:
        try:
            _s3.create_bucket(Bucket=bucket)
            print(f"[+] Created MinIO bucket: {bucket}")
        except Exception as e:
            print(f"[!] Could not create bucket {bucket}: {e}")
