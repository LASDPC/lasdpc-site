from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from routers.rooms import get_current_user, require_admin, router

app = FastAPI()
app.include_router(router, prefix="/api/v1/rooms")

ADMIN = {"_id": "admin1", "name": "Admin", "is_admin": True}


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.rooms = MagicMock()
    db.rooms.find = MagicMock()
    db.rooms.find_one = AsyncMock()
    db.rooms.insert_one = AsyncMock()
    db.rooms.delete_one = AsyncMock()
    db.room_events = MagicMock()
    db.room_events.find_one = AsyncMock()
    return db


@pytest.fixture
def client(mock_db):
    app.dependency_overrides[get_current_user] = lambda: ADMIN
    app.dependency_overrides[require_admin] = lambda: ADMIN
    with patch("routers.rooms.get_db", return_value=mock_db):
        yield mock_db
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_room_success(client):
    mock_db = client
    mock_db.rooms.find_one.return_value = None
    oid = ObjectId()
    mock_db.rooms.insert_one.return_value = MagicMock(inserted_id=oid)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/v1/rooms", json={"name": " 1-011 "})

    assert resp.status_code == 201
    assert resp.json()["name"] == "1-011"
    doc = mock_db.rooms.insert_one.call_args[0][0]
    assert doc["normalized_name"] == "1-011"


@pytest.mark.asyncio
async def test_create_room_duplicate_rejected(client):
    mock_db = client
    mock_db.rooms.find_one.return_value = {"_id": ObjectId(), "name": "1-009"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/v1/rooms", json={"name": "1-009"})

    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_delete_room_with_future_event_is_blocked(client):
    mock_db = client
    oid = ObjectId()
    mock_db.rooms.find_one.return_value = {"_id": oid, "name": "1-009"}
    mock_db.room_events.find_one.return_value = {
        "_id": ObjectId(),
        "room": "1-009",
        "end_time": datetime.utcnow() + timedelta(hours=1),
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.delete(f"/api/v1/rooms/{oid}")

    assert resp.status_code == 409
    mock_db.rooms.delete_one.assert_not_called()


@pytest.mark.asyncio
async def test_delete_room_without_future_event(client):
    mock_db = client
    oid = ObjectId()
    mock_db.rooms.find_one.return_value = {"_id": oid, "name": "1-009"}
    mock_db.room_events.find_one.return_value = None

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.delete(f"/api/v1/rooms/{oid}")

    assert resp.status_code == 204
    mock_db.rooms.delete_one.assert_called_once_with({"_id": oid})
