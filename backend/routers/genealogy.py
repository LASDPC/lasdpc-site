from __future__ import annotations

import asyncio
import json
import re
import unicodedata
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.database import get_db
from core.dependencies import require_admin
from models.genealogy import (
    GenealogyEdge,
    GenealogyNode,
    GenealogyStats,
    GenealogyTreeResponse,
    ProfessorGenealogyCard,
)

router = APIRouter()

CACHE_FILE = Path(__file__).resolve().parent.parent / "data" / "genealogy_data.json"


def _load_fallback_json() -> dict[str, Any]:
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"meta": {}, "professors": [], "nodes": [], "edges": []}


def _normalize_name(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    return " ".join(re.sub(r"[^a-zA-Z0-9]+", " ", ascii_value).lower().split())


def _direct_tree(
    profs_data: list[dict[str, Any]],
    nodes_data: list[dict[str, Any]],
    edges_data: list[dict[str, Any]],
    *,
    professor: Optional[str] = None,
    degree: Optional[str] = None,
    min_year: Optional[int] = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    """Keep only LaSDPC faculty roots and their direct advisees.

    The first public version deliberately exposes one descendant generation.
    This keeps the graph readable while retaining the complete Acacia metrics
    on each professor card.
    """
    active_professors = profs_data
    if professor:
        active_professors = [item for item in profs_data if item.get("slug") == professor]
        if not active_professors:
            raise HTTPException(status_code=404, detail=f"Professor '{professor}' not found in genealogy")

    root_ids = {str(item.get("acacia_id")) for item in active_professors}
    visible_edges = []
    for edge in edges_data:
        if str(edge.get("source")) not in root_ids:
            continue
        if degree and edge.get("degree_code") != degree.upper():
            continue
        if min_year and edge.get("year") and edge.get("year") < min_year:
            continue
        visible_edges.append(edge)

    visible_ids = root_ids | {str(edge.get("target")) for edge in visible_edges}
    visible_nodes = [node for node in nodes_data if str(node.get("id")) in visible_ids]

    relationship_count = len({(str(edge.get("source")), str(edge.get("target"))) for edge in visible_edges})
    visible_stats = {
        "total_nodes": len(visible_nodes),
        "total_edges": len(visible_edges),
        "total_docentes": len(active_professors),
        "masters_degrees": sum(edge.get("degree_code") == "M" for edge in visible_edges),
        "doctorate_degrees": sum(edge.get("degree_code") == "D" for edge in visible_edges),
        "coorientations": sum(bool(edge.get("is_coorientation")) for edge in visible_edges),
        "total_descendants_accumulated": relationship_count,
        "direct_advisees_total": relationship_count,
    }
    return active_professors, visible_nodes, visible_edges, visible_stats


@router.get("/tree", response_model=GenealogyTreeResponse)
async def get_genealogy_tree(
    professor: Optional[str] = Query(None, description="Filter by professor slug, e.g. julio-cezar-estrella"),
    degree: Optional[str] = Query(None, description="Filter degree code: M, D, P"),
    min_year: Optional[int] = Query(None, description="Minimum defense year"),
    max_depth: Optional[int] = Query(1, description="Public tree depth (currently fixed at one direct generation)"),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Returns the full or filtered academic genealogy tree (nodes, edges,
    professors cards, and stats). Reads from MongoDB with automatic fallback
    to static JSON cache.
    """
    nodes_data: list[dict[str, Any]] = []
    edges_data: list[dict[str, Any]] = []
    profs_data: list[dict[str, Any]] = []
    stats_data: dict[str, Any] = {}

    used_mongo = False
    try:
        profs_cursor = db.genealogy_professors.find({})
        profs_data = await profs_cursor.to_list(length=100)
        if profs_data:
            used_mongo = True
            nodes_cursor = db.genealogy_nodes.find({})
            nodes_data = await nodes_cursor.to_list(length=2000)
            edges_cursor = db.genealogy_edges.find({})
            edges_data = await edges_cursor.to_list(length=3000)
            meta_doc = await db.genealogy_meta.find_one({"_id": "current"})
            if meta_doc:
                stats_data = meta_doc.get("stats", {})
    except Exception:
        used_mongo = False

    if not used_mongo or not profs_data:
        fallback = _load_fallback_json()
        profs_data = fallback.get("professors", [])
        nodes_data = fallback.get("nodes", [])
        edges_data = fallback.get("edges", [])
        stats_data = fallback.get("meta", {})

    # The faculty roots mirror the public "Docentes" tab.  If MongoDB is
    # available, remove stale genealogy roots that are no longer faculty.
    if used_mongo:
        docentes = await db.users.find({
            "role": "docente",
            "status": {"$ne": "pending"},
            "is_admin": {"$ne": True},
        }, {"name": 1}).to_list(length=1000)
        docente_names = {_normalize_name(item.get("name", "")) for item in docentes}
        if docente_names:
            profs_data = [item for item in profs_data if _normalize_name(item.get("name", "")) in docente_names]

    profs_data, nodes_data, edges_data, direct_stats = _direct_tree(
        profs_data,
        nodes_data,
        edges_data,
        professor=professor,
        degree=degree,
        min_year=min_year,
    )
    if stats_data.get("last_sync_utc"):
        direct_stats["last_sync_utc"] = stats_data["last_sync_utc"]
    stats_data = direct_stats

    # Convert professors data into card response
    cards = []
    for p in profs_data:
        cards.append(ProfessorGenealogyCard(
            slug=p.get("slug", ""),
            name=p.get("name", ""),
            acacia_id=str(p.get("acacia_id", "")),
            title=p.get("title"),
            titlePt=p.get("titlePt"),
            email=p.get("email"),
            area=p.get("area"),
            lattes_id=p.get("lattes_id"),
            lattes_url=p.get("lattes_url"),
            profile_url=p.get("profile_url"),
            metrics=p.get("metrics", {}),
            percentiles=p.get("percentiles"),
            direct_advisees_count=len(p.get("direct_advisees", [])),
            areas=p.get("areas"),
            timelines=p.get("timelines"),
        ))

    nodes = [GenealogyNode(**n) for n in nodes_data]
    edges = [GenealogyEdge(**e) for e in edges_data]
    stats = GenealogyStats(**stats_data) if stats_data else GenealogyStats(
        total_nodes=len(nodes),
        total_edges=len(edges),
        total_docentes=len(cards),
    )

    return GenealogyTreeResponse(
        stats=stats,
        nodes=nodes,
        edges=edges,
        professors=cards,
    )


@router.get("/professors", response_model=list[ProfessorGenealogyCard])
async def list_professors_genealogy(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Return genealogy cards only for people in the public faculty list."""
    try:
        profs = await db.genealogy_professors.find({}).to_list(length=100)
        docentes = await db.users.find({
            "role": "docente",
            "status": {"$ne": "pending"},
            "is_admin": {"$ne": True},
        }, {"name": 1}).to_list(length=1000)
        docente_names = {_normalize_name(item.get("name", "")) for item in docentes}
        if docente_names:
            profs = [item for item in profs if _normalize_name(item.get("name", "")) in docente_names]
    except Exception:
        profs = []

    if not profs:
        fallback = _load_fallback_json()
        profs = fallback.get("professors", [])

    cards = []
    for p in profs:
        cards.append(ProfessorGenealogyCard(
            slug=p.get("slug", ""),
            name=p.get("name", ""),
            acacia_id=str(p.get("acacia_id", "")),
            title=p.get("title"),
            titlePt=p.get("titlePt"),
            email=p.get("email"),
            area=p.get("area"),
            lattes_id=p.get("lattes_id"),
            lattes_url=p.get("lattes_url"),
            profile_url=p.get("profile_url"),
            metrics=p.get("metrics", {}),
            percentiles=p.get("percentiles"),
            direct_advisees_count=len(p.get("direct_advisees", [])),
            areas=p.get("areas"),
            timelines=p.get("timelines"),
        ))
    return cards


@router.get("/professor/{slug}", response_model=dict[str, Any])
async def get_professor_detail(slug: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Returns full professor details including direct advisees list, area
    charts data and defense timelines.
    """
    try:
        prof = await db.genealogy_professors.find_one({"slug": slug})
    except Exception:
        prof = None

    if not prof:
        fallback = _load_fallback_json()
        prof = next((p for p in fallback.get("professors", []) if p.get("slug") == slug), None)

    if not prof:
        raise HTTPException(status_code=404, detail="Professor not found")

    if "_id" in prof:
        prof["_id"] = str(prof["_id"])
    return prof


@router.get("/stats", response_model=GenealogyStats)
async def get_genealogy_stats(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Return statistics for the one-generation public tree."""
    try:
        profs = await db.genealogy_professors.find({}).to_list(length=100)
        nodes = await db.genealogy_nodes.find({}).to_list(length=2000)
        edges = await db.genealogy_edges.find({}).to_list(length=3000)
        docentes = await db.users.find({
            "role": "docente",
            "status": {"$ne": "pending"},
            "is_admin": {"$ne": True},
        }, {"name": 1}).to_list(length=1000)
        docente_names = {_normalize_name(item.get("name", "")) for item in docentes}
        if docente_names:
            profs = [item for item in profs if _normalize_name(item.get("name", "")) in docente_names]
        if profs:
            _, _, _, stats = _direct_tree(profs, nodes, edges)
            return GenealogyStats(**stats)
    except Exception:
        pass

    fallback = _load_fallback_json()
    _, _, _, stats = _direct_tree(
        fallback.get("professors", []),
        fallback.get("nodes", []),
        fallback.get("edges", []),
    )
    if fallback.get("meta", {}).get("last_sync_utc"):
        stats["last_sync_utc"] = fallback["meta"]["last_sync_utc"]
    return GenealogyStats(**stats)


@router.post("/sync", status_code=status.HTTP_202_ACCEPTED)
async def trigger_genealogy_sync(
    current_admin=Depends(require_admin),
):
    """Triggers a background synchronization with Plataforma Acácia.
    Admin only.
    """
    from scripts.sync_genealogy import sync_all

    asyncio.create_task(sync_all())
    return {"message": "Genealogy sync triggered in background"}
