from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query, status

from core.database import get_db
from core.profile_terms import (
    DEFAULT_RESEARCH_AREAS,
    LAB_RELATIONSHIP_TYPES,
    PROFILE_TERM_KINDS,
    clean_list,
    clean_text,
    normalize_text,
    term_matches,
    term_score,
)
from models.profile_term import ProfileTermOut

router = APIRouter()


def _term_id(kind: str, value: str, relationship_type: Optional[str] = None) -> str:
    prefix = relationship_type or kind
    return f"{prefix}:{normalize_text(value)}"


def _term_out(doc: dict) -> ProfileTermOut:
    raw_id = doc.get("_id")
    id_value = str(raw_id) if isinstance(raw_id, ObjectId) else _term_id(
        doc["kind"],
        doc["value"],
        doc.get("relationship_type"),
    )
    return ProfileTermOut(
        id=id_value,
        kind=doc["kind"],
        value=doc["value"],
        relationship_type=doc.get("relationship_type"),
        is_default=bool(doc.get("is_default")),
    )


async def _terms_from_users(db, kind: str, relationship_type: Optional[str]) -> list[dict]:
    projection = {"research_areas": 1, "skills": 1, "affiliation_name": 1, "lab_relationship_type": 1}
    users = await db.users.find({}, projection).to_list(1000)
    terms: dict[tuple[str, Optional[str]], dict] = {}

    for user in users:
        if kind == "research_area":
            values = clean_list(user.get("research_areas"))
            relation = None
        elif kind == "skill":
            values = clean_list(user.get("skills"))
            relation = None
        else:
            relation = clean_text(user.get("lab_relationship_type")) or None
            if relationship_type and relation != relationship_type:
                continue
            values = [clean_text(user.get("affiliation_name"))]

        for value in values:
            if not value:
                continue
            key = (normalize_text(value), relation)
            terms[key] = {"kind": kind, "value": value, "relationship_type": relation}

    return list(terms.values())


@router.get("", response_model=list[ProfileTermOut])
async def suggest_profile_terms(
    kind: str = Query(..., pattern="^(research_area|skill|affiliation)$"),
    query: str = Query("", max_length=100),
    relationship_type: Optional[str] = Query(default=None),
    limit: int = Query(default=12, ge=1, le=50),
):
    if kind not in PROFILE_TERM_KINDS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid term kind")
    if relationship_type and relationship_type not in LAB_RELATIONSHIP_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid relationship type")
    if kind != "affiliation":
        relationship_type = None

    db = get_db()
    term_query: dict = {"kind": kind}
    if relationship_type:
        term_query["relationship_type"] = relationship_type
    stored = await db.profile_terms.find(term_query).to_list(1000)
    derived = await _terms_from_users(db, kind, relationship_type)
    defaults = [
        {"kind": "research_area", "value": value, "relationship_type": None, "is_default": True}
        for value in DEFAULT_RESEARCH_AREAS
    ] if kind == "research_area" else []

    merged: dict[tuple[str, Optional[str]], dict] = {}
    for doc in [*defaults, *stored, *derived]:
        value = clean_text(doc.get("value"))
        if not value:
            continue
        relation = doc.get("relationship_type") if kind == "affiliation" else None
        key = (normalize_text(value), relation)
        previous = merged.get(key, {})
        merged[key] = {**previous, **doc, "kind": kind, "value": value, "relationship_type": relation}

    q = clean_text(query)
    matches = [doc for doc in merged.values() if term_matches(doc["value"], q)]
    matches.sort(key=lambda doc: term_score(doc["value"], q))
    return [_term_out(doc) for doc in matches[:limit]]
