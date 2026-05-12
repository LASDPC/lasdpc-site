import asyncio
import time

from fastapi import APIRouter

from core.database import get_db

router = APIRouter()

_cache: dict = {"data": None, "ts": 0}
_CACHE_TTL = 60


@router.get("")
async def get_stats():
    now = time.time()
    if _cache["data"] is not None and now - _cache["ts"] < _CACHE_TTL:
        return _cache["data"]

    db = get_db()

    researchers_count, publications_count, clusters_count = await asyncio.gather(
        _count_researchers(db),
        db.publications.count_documents({}),
        db.clusters.count_documents({}),
    )

    data = {
        "researchers": researchers_count,
        "publications": publications_count,
        "clusters": clusters_count,
    }

    _cache["data"] = data
    _cache["ts"] = now
    return data


async def _count_researchers(db) -> int:
    """Count active researchers for the home-page stats card.

    Alumni are intentionally excluded - they are former members and should
    not inflate the "current researchers" counter.
    """
    docentes, students = await asyncio.gather(
        db.users.count_documents({"role": "docente", "status": "active"}),
        db.users.count_documents({"role": "aluno_ativo", "status": "active"}),
    )
    return docentes + students
