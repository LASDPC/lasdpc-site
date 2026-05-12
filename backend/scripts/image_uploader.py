"""Helpers to upload local image files to MinIO during the seed.

Reuses the storage primitives in `backend/core/storage.py` so behaviour stays
consistent with runtime uploads done by the API.
"""

from __future__ import annotations

import mimetypes
from pathlib import Path
from typing import Optional

from botocore.exceptions import ClientError, EndpointConnectionError

from core.storage import ALLOWED_MIME, build_key, put_object_stream


# Set to True once `ensure_bucket` has confirmed MinIO is reachable AND the
# credentials work. If a runtime upload fails afterwards, we flip it back to
# False so the seed stops hammering a broken MinIO and finishes gracefully
# without images instead of crashing halfway through.
_uploads_enabled = False


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


def upload_local_image(path: Path, prefix: str) -> Optional[str]:
    """Upload `path` to MinIO under `prefix/...` and return the object key.

    Returns ``None`` (and disables further uploads) if MinIO becomes
    unreachable or rejects the credentials mid-seed, so a transient storage
    failure never aborts the entire database seed.
    """
    global _uploads_enabled
    if not _uploads_enabled:
        return None

    mime = guess_mime(path)
    key = build_key(prefix, mime)
    try:
        with path.open("rb") as f:
            put_object_stream(key, f, mime)
        return key
    except (ClientError, EndpointConnectionError, OSError) as exc:
        _uploads_enabled = False
        print(
            f"[!] MinIO upload failed for {path.name} ({exc}); "
            "continuing seed without further image uploads."
        )
        return None


def ensure_bucket() -> None:
    """Ensure the MinIO bucket exists, creating it if needed.

    Raises if MinIO is unreachable or the credentials are invalid so the
    caller can disable image uploads cleanly. Only the "bucket does not
    exist" case is handled internally (by creating it).
    """
    global _uploads_enabled
    from core.storage import _s3
    from core.config import settings

    bucket = settings.minio_bucket

    try:
        _s3.head_bucket(Bucket=bucket)
        _uploads_enabled = True
        return
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        http_status = e.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
        bucket_missing = (
            error_code in ("404", "NoSuchBucket", "NoSuchKey")
            or http_status == 404
        )
        if not bucket_missing:
            # Auth, permission or network-shaped error -> propagate so the
            # seed disables image uploads instead of pretending all is well.
            raise

    # Bucket missing -> create it. Auth errors here will propagate too.
    _s3.create_bucket(Bucket=bucket)
    print(f"[+] Created MinIO bucket: {bucket}")
    _uploads_enabled = True
