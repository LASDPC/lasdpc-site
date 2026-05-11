import uuid

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from .config import settings

ALLOWED_MIME = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}

_s3 = boto3.client(
    "s3",
    endpoint_url=settings.minio_endpoint,
    aws_access_key_id=settings.minio_root_user,
    aws_secret_access_key=settings.minio_root_password,
    config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    region_name="us-east-1",
)


def build_key(prefix: str, mime: str) -> str:
    ext = ALLOWED_MIME[mime]
    return f"{prefix}/{uuid.uuid4().hex}.{ext}"


def put_object_stream(key: str, fileobj, content_type: str) -> None:
    _s3.upload_fileobj(
        Fileobj=fileobj,
        Bucket=settings.minio_bucket,
        Key=key,
        ExtraArgs={
            "ContentType": content_type,
            "CacheControl": "public, max-age=31536000, immutable",
        },
    )


def delete_object(key: str) -> None:
    try:
        _s3.delete_object(Bucket=settings.minio_bucket, Key=key)
    except ClientError:
        pass


def public_url(key: str) -> str:
    return f"{settings.minio_public_url.rstrip('/')}/{key}"
