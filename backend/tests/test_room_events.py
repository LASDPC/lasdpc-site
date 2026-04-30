from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from routers.room_events import router

app = FastAPI()
app.include_router(router, prefix="/api/v1/room-events")

FAKE_USER = {"_id": "user1", "name": "Test User", "email": "test@test.com"}
OTHER_USER = {"_id": "user2", "name": "Other User", "email": "other@test.com"}

NOW = datetime(2026, 4, 30, 10, 0, 0)


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.room_events = MagicMock()
    db.room_events.find = MagicMock()
    db.room_events.find_one = AsyncMock()
    db.room_events.insert_one = AsyncMock()
    db.room_events.delete_one = AsyncMock()
    db.room_events.create_index = AsyncMock()
    return db


@pytest.fixture
def client(mock_db):
    with patch("routers.room_events.get_db", return_value=mock_db), \
         patch("routers.room_events.get_current_user", return_value=FAKE_USER):
        yield mock_db


@pytest.mark.asyncio
async def test_create_event_success(client):
    mock_db = client
    mock_db.room_events.find_one.return_value = None
    inserted_oid = ObjectId()
    mock_db.room_events.insert_one.return_value = MagicMock(inserted_id=inserted_oid)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/v1/room-events", json={
            "room": "1-009",
            "title": "Test Event",
            "start_time": NOW.isoformat(),
            "end_time": (NOW + timedelta(hours=1)).isoformat(),
        })
    assert resp.status_code == 201
    mock_db.room_events.insert_one.assert_called_once()
    doc = mock_db.room_events.insert_one.call_args[0][0]
    assert doc["room"] == "1-009"
    assert doc["title"] == "Test Event"
    assert doc["user_id"] == "user1"
    assert doc["expires_at"] == (NOW + timedelta(hours=1)) + timedelta(days=30)


@pytest.mark.asyncio
async def test_create_event_overlap(client):
    mock_db = client
    mock_db.room_events.find_one.return_value = {"_id": "existing", "room": "1-009"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/v1/room-events", json={
            "room": "1-009",
            "title": "Overlap Event",
            "start_time": NOW.isoformat(),
            "end_time": (NOW + timedelta(hours=1)).isoformat(),
        })
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_create_event_too_old_rejected(client):
    mock_db = client
    mock_db.room_events.find_one.return_value = None

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/v1/room-events", json={
            "room": "1-009",
            "title": "Too Old",
            "start_time": (NOW - timedelta(days=31, hours=1)).isoformat(),
            "end_time": (NOW - timedelta(days=31)).isoformat(),
        })
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_delete_own_event(client):
    mock_db = client
    oid = ObjectId()
    mock_db.room_events.find_one.return_value = {
        "_id": oid, "user_id": "user1", "room": "1-009",
        "title": "My Event", "start_time": NOW, "end_time": NOW + timedelta(hours=1),
    }
    mock_db.room_events.delete_one.return_value = MagicMock(deleted_count=1)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.delete(f"/api/v1/room-events/{str(oid)}")
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_other_user_event(client):
    mock_db = client
    oid = ObjectId()
    mock_db.room_events.find_one.return_value = {
        "_id": oid, "user_id": "user2", "room": "1-009",
        "title": "Their Event", "start_time": NOW, "end_time": NOW + timedelta(hours=1),
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.delete(f"/api/v1/room-events/{str(oid)}")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_events(client):
    mock_db = client
    cursor_mock = MagicMock()
    cursor_mock.to_list = AsyncMock(return_value=[
        {
            "_id": "evt1", "room": "1-009", "title": "Event 1",
            "start_time": NOW, "end_time": NOW + timedelta(hours=1),
            "user_id": "user1", "user_name": "Test User",
            "created_at": NOW,
        }
    ])
    mock_db.room_events.find.return_value = cursor_mock

    start = NOW.isoformat()
    end = (NOW + timedelta(days=7)).isoformat()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get(f"/api/v1/room-events?room=1-009&start={start}&end={end}")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["title"] == "Event 1"


@pytest.mark.asyncio
async def test_patch_event_updates_title(client):
    mock_db = client
    oid = ObjectId()
    mock_db.room_events.find_one.return_value = {
        "_id": oid,
        "user_id": "user1",
        "room": "1-009",
        "title": "Old",
        "start_time": NOW,
        "end_time": NOW + timedelta(hours=1),
        "user_name": "Test User",
        "created_at": NOW,
        "participants": [],
    }
    mock_db.room_events.update_one = AsyncMock()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.patch(f"/api/v1/room-events/{str(oid)}", json={"title": "New Title"})
    assert resp.status_code == 200
    mock_db.room_events.update_one.assert_called_once()
    args, _kwargs = mock_db.room_events.update_one.call_args
    assert args[0] == {"_id": oid}
    assert args[1]["$set"]["title"] == "New Title"


@pytest.mark.asyncio
async def test_patch_event_non_owner_forbidden(client):
    mock_db = client
    oid = ObjectId()
    mock_db.room_events.find_one.return_value = {
        "_id": oid,
        "user_id": "user2",
        "room": "1-009",
        "title": "Old",
        "start_time": NOW,
        "end_time": NOW + timedelta(hours=1),
        "user_name": "Other User",
        "created_at": NOW,
        "participants": [],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.patch(f"/api/v1/room-events/{str(oid)}", json={"title": "New Title"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_patch_event_invalid_id(client):
    mock_db = client
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.patch("/api/v1/room-events/not-an-oid", json={"title": "New Title"})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_patch_event_empty_title_rejected(client):
    mock_db = client
    oid = ObjectId()
    mock_db.room_events.find_one.return_value = {
        "_id": oid,
        "user_id": "user1",
        "room": "1-009",
        "title": "Old",
        "start_time": NOW,
        "end_time": NOW + timedelta(hours=1),
        "user_name": "Test User",
        "created_at": NOW,
        "participants": [],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.patch(f"/api/v1/room-events/{str(oid)}", json={"title": "   "})
    assert resp.status_code == 400
