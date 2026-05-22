from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from routers.blog import SEARCH_FIELDS, router

app = FastAPI()
app.include_router(router, prefix="/api/v1/blog")


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.blog_posts = MagicMock()
    db.blog_posts.find = MagicMock()
    return db


@pytest.mark.asyncio
async def test_list_posts_uses_empty_filter_by_default(mock_db):
    cursor_mock = MagicMock()
    cursor_mock.to_list = AsyncMock(return_value=[])
    mock_db.blog_posts.find.return_value = cursor_mock

    with patch("routers.blog.get_db", return_value=mock_db):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/api/v1/blog")

    assert resp.status_code == 200
    assert resp.json() == []
    mock_db.blog_posts.find.assert_called_once_with({})


@pytest.mark.asyncio
async def test_list_posts_builds_query_filters(mock_db):
    cursor_mock = MagicMock()
    cursor_mock.to_list = AsyncMock(return_value=[])
    mock_db.blog_posts.find.return_value = cursor_mock

    with patch("routers.blog.get_db", return_value=mock_db):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/api/v1/blog?q=cloud&tag=news&year=2024&author=ana")

    assert resp.status_code == 200
    regex_cloud = {"$regex": "cloud", "$options": "i"}
    mock_db.blog_posts.find.assert_called_once_with({
        "$or": [{field: regex_cloud} for field in SEARCH_FIELDS],
        "tag": {"$regex": "news", "$options": "i"},
        "date": {"$regex": "2024", "$options": "i"},
        "author": {"$regex": "ana", "$options": "i"},
    })
