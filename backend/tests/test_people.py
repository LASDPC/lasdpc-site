from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from routers.people import router

app = FastAPI()
app.include_router(router, prefix="/api/v1/people")


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.users = MagicMock()
    db.users.find = MagicMock()
    return db


@pytest.mark.asyncio
async def test_list_docentes_excludes_admin_users(mock_db):
    cursor_mock = MagicMock()
    cursor_mock.to_list = AsyncMock(return_value=[])
    mock_db.users.find.return_value = cursor_mock

    with patch("routers.people.get_db", return_value=mock_db):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/api/v1/people/docentes")

    assert resp.status_code == 200
    mock_db.users.find.assert_called_once_with({
        "role": "docente",
        "status": {"$ne": "pending"},
        "is_admin": {"$ne": True},
    })


@pytest.mark.asyncio
async def test_list_students_excludes_admin_users(mock_db):
    cursor_mock = MagicMock()
    cursor_mock.to_list = AsyncMock(return_value=[])
    mock_db.users.find.return_value = cursor_mock

    with patch("routers.people.get_db", return_value=mock_db):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/api/v1/people/students")

    assert resp.status_code == 200
    mock_db.users.find.assert_called_once_with({
        "role": {"$in": ["aluno_ativo", "alumni"]},
        "status": {"$ne": "pending"},
        "is_admin": {"$ne": True},
    })
