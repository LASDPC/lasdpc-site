from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from routers.profile_terms import router

app = FastAPI()
app.include_router(router, prefix="/api/v1/profile-terms")


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.profile_terms = MagicMock()
    db.profile_terms.find = MagicMock()
    db.users = MagicMock()
    db.users.find = MagicMock()
    return db


@pytest.mark.asyncio
async def test_profile_terms_merge_stored_and_user_terms(mock_db):
    stored_cursor = MagicMock()
    stored_cursor.to_list = AsyncMock(return_value=[
        {"kind": "skill", "value": "Python", "normalized_value": "python"},
    ])
    users_cursor = MagicMock()
    users_cursor.to_list = AsyncMock(return_value=[
        {"skills": ["Python", "PyTorch"]},
    ])
    mock_db.profile_terms.find.return_value = stored_cursor
    mock_db.users.find.return_value = users_cursor

    with patch("routers.profile_terms.get_db", return_value=mock_db):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/api/v1/profile-terms?kind=skill&query=py")

    assert resp.status_code == 200
    assert [item["value"] for item in resp.json()] == ["Python", "PyTorch"]


@pytest.mark.asyncio
async def test_profile_terms_filter_affiliation_by_relationship(mock_db):
    stored_cursor = MagicMock()
    stored_cursor.to_list = AsyncMock(return_value=[])
    users_cursor = MagicMock()
    users_cursor.to_list = AsyncMock(return_value=[
        {
            "affiliation_name": "ICMC USP",
            "lab_relationship_type": "usp_organization",
        },
        {
            "affiliation_name": "External University",
            "lab_relationship_type": "external_organization",
        },
    ])
    mock_db.profile_terms.find.return_value = stored_cursor
    mock_db.users.find.return_value = users_cursor

    with patch("routers.profile_terms.get_db", return_value=mock_db):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get(
                "/api/v1/profile-terms?kind=affiliation&relationship_type=usp_organization"
            )

    assert resp.status_code == 200
    assert [item["value"] for item in resp.json()] == ["ICMC USP"]
