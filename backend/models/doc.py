import re

from pydantic import BaseModel, field_validator

_SEGMENT_RE = re.compile(r"^[^/\\:*?\"<>|]+$")


def normalize_doc_path(raw: str) -> str:
    """Normalize a slash-separated doc path like "reunioes/2026/ata.md".

    Document paths also contribute folders to the tree. Explicit folders are
    stored separately so empty folders remain visible.
    """
    path = re.sub(r"/+", "/", raw.strip().strip("/"))
    segments = [s.strip() for s in path.split("/")]
    if not path or any(not s or s in (".", "..") or not _SEGMENT_RE.match(s) for s in segments):
        raise ValueError("Invalid path")
    if not segments[-1].lower().endswith(".md") or segments[-1].lower() == ".md":
        raise ValueError("Path must point to a .md file")
    return "/".join(segments)


def normalize_folder_path(raw: str) -> str:
    path = re.sub(r"/+", "/", raw.strip().strip("/"))
    segments = [s.strip() for s in path.split("/")]
    if not path or any(not s or s in (".", "..") or not _SEGMENT_RE.match(s) for s in segments):
        raise ValueError("Invalid folder path")
    return "/".join(segments)


class DocBase(BaseModel):
    path: str
    content: str
    updatedAt: str

    @field_validator("path")
    @classmethod
    def _validate_path(cls, v: str) -> str:
        return normalize_doc_path(v)


class DocCreate(DocBase):
    pass


class DocUpdate(DocBase):
    pass


class DocOut(DocBase):
    id: str


class FolderCreate(BaseModel):
    path: str

    @field_validator("path")
    @classmethod
    def _validate_path(cls, v: str) -> str:
        return normalize_folder_path(v)


class FolderOut(FolderCreate):
    id: str
