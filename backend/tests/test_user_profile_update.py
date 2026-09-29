from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from routers.users import get_current_user, router

app = FastAPI()
app.include_router(router, prefix="/api/v1/users")


@pytest.fixture
def profile_db():
    user_id = ObjectId()
    user = {
        "_id": user_id,
        "email": "member@example.com",
        "name": "Lab Member",
        "initials": "LM",
        "role": "aluno_ativo",
        "is_admin": False,
        "lattes": "https://lattes.cnpq.br/123",
    }
    db = MagicMock()
    db.users.find_one = AsyncMock(return_value=user)
    db.users.update_one = AsyncMock(return_value=MagicMock(matched_count=1))
    app.dependency_overrides[get_current_user] = lambda: user
    with patch("routers.users.get_db", return_value=db), patch(
        "routers.users.upsert_profile_terms", new_callable=AsyncMock
    ):
        yield db, user
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_profile_update_allows_optional_fields_to_be_empty(profile_db):
    db, user = profile_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.put(
            f"/api/v1/users/{user['_id']}",
            json={"bioPt": "Nova biografia", "photo": None, "level": None, "levelPt": None,
                  "orcid": None, "scholar": None, "github": None,
                  "lab_relationship_type": None, "affiliation_name": None},
        )

    assert response.status_code == 200
    db.users.update_one.assert_awaited_once()


@pytest.mark.asyncio
async def test_profile_update_requires_lattes(profile_db):
    db, user = profile_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.put(f"/api/v1/users/{user['_id']}", json={"lattes": ""})

    assert response.status_code == 400
    assert "lattes" in response.json()["detail"]
    db.users.update_one.assert_not_awaited()


@pytest.mark.asyncio
async def test_photo_can_be_updated_before_lattes_is_added(profile_db):
    db, user = profile_db
    user["lattes"] = None
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.put(f"/api/v1/users/{user['_id']}", json={"photo": "uploads/photo.jpg"})

    assert response.status_code == 200
    db.users.update_one.assert_awaited_once()


@pytest.mark.asyncio
async def test_banner_can_be_updated_before_lattes_is_added(profile_db):
    db, user = profile_db
    user["lattes"] = None
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.put(f"/api/v1/users/{user['_id']}", json={"banner": "banner/cover.webp"})

    assert response.status_code == 200
    db.users.update_one.assert_awaited_once()
    assert db.users.update_one.await_args.args[1]["$set"] == {"banner": "banner/cover.webp"}
