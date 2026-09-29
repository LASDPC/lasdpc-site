from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from fastapi import HTTPException

from models.doc import FolderCreate, normalize_folder_path
from routers.docs import create_folder, delete_folder


def test_folder_paths_are_normalized_and_validated():
    assert normalize_folder_path(" meetings//2026 ") == "meetings/2026"
    with pytest.raises(ValueError):
        normalize_folder_path("meetings/../secret")


@pytest.mark.asyncio
async def test_empty_folder_can_be_created_and_deleted():
    db = MagicMock()
    db.doc_folders.find_one = AsyncMock(return_value=None)
    db.docs.find_one = AsyncMock(return_value=None)
    inserted_id = ObjectId()
    db.doc_folders.insert_one = AsyncMock(return_value=MagicMock(inserted_id=inserted_id))
    db.doc_folders.delete_one = AsyncMock()

    with patch("routers.docs.get_db", return_value=db):
        created = await create_folder(FolderCreate(path="meetings"), _admin={})
        assert created.path == "meetings"
        # Simulate the persisted folder with the returned identifier.
        db.doc_folders.find_one = AsyncMock(side_effect=[{"_id": inserted_id, "path": "meetings"}, None])
        await delete_folder(str(inserted_id), _admin={})

    db.doc_folders.delete_one.assert_awaited_once_with({"_id": inserted_id})


@pytest.mark.asyncio
async def test_nonempty_folder_cannot_be_deleted():
    folder_id = ObjectId()
    db = MagicMock()
    db.doc_folders.find_one = AsyncMock(return_value={"_id": folder_id, "path": "meetings"})
    db.docs.find_one = AsyncMock(return_value={"path": "meetings/notes.md"})

    with patch("routers.docs.get_db", return_value=db):
        with pytest.raises(HTTPException) as error:
            await delete_folder(str(folder_id), _admin={})

    assert error.value.status_code == 409
