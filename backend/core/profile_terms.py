import re
import unicodedata
from datetime import datetime, timezone
from difflib import SequenceMatcher
from typing import Optional

from fastapi import HTTPException, status

LAB_RELATIONSHIP_TYPES = {
    "academic_advisor",
    "usp_organization",
    "external_organization",
}

PROFILE_TERM_KINDS = {"research_area", "skill", "affiliation"}

REQUIRED_PROFILE_FIELDS = (
    "photo",
    "lattes",
    "orcid",
    "scholar",
    "github",
    "lab_relationship_type",
    "affiliation_name",
)


def normalize_text(value: str) -> str:
    without_accents = unicodedata.normalize("NFKD", value)
    ascii_value = "".join(ch for ch in without_accents if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", ascii_value).strip().casefold()


def clean_text(value: Optional[str]) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def clean_list(values: Optional[list[str]]) -> list[str]:
    if not values:
        return []
    out: list[str] = []
    seen: set[str] = set()
    for value in values:
        clean = clean_text(value)
        key = normalize_text(clean)
        if not clean or key in seen:
            continue
        seen.add(key)
        out.append(clean)
    return sorted(out, key=lambda item: item.casefold())


def validate_required_profile(doc: dict) -> None:
    missing = [field for field in REQUIRED_PROFILE_FIELDS if not clean_text(doc.get(field))]
    relationship_type = clean_text(doc.get("lab_relationship_type"))
    if relationship_type and relationship_type not in LAB_RELATIONSHIP_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid lab relationship type",
        )
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required profile fields: {', '.join(missing)}",
        )


def normalize_profile_payload(doc: dict) -> None:
    for field in ("lattes", "orcid", "scholar", "github", "photo", "affiliation_name"):
        if field in doc and doc[field] is not None:
            doc[field] = clean_text(str(doc[field])) or None
    if "lab_relationship_type" in doc and doc["lab_relationship_type"] is not None:
        doc["lab_relationship_type"] = clean_text(str(doc["lab_relationship_type"])) or None
    if "research_areas" in doc:
        cleaned_research_areas = clean_list(doc.get("research_areas"))
        doc["research_areas"] = cleaned_research_areas or None
    if "skills" in doc:
        cleaned_skills = clean_list(doc.get("skills"))
        doc["skills"] = cleaned_skills or None


async def upsert_profile_terms(db, doc: dict) -> None:
    now = datetime.now(timezone.utc)
    operations = []

    for value in clean_list(doc.get("research_areas")):
        operations.append(("research_area", value, None))
    for value in clean_list(doc.get("skills")):
        operations.append(("skill", value, None))

    affiliation = clean_text(doc.get("affiliation_name"))
    relationship_type = clean_text(doc.get("lab_relationship_type"))
    if affiliation and relationship_type in LAB_RELATIONSHIP_TYPES:
        operations.append(("affiliation", affiliation, relationship_type))

    for kind, value, relation in operations:
        normalized_value = normalize_text(value)
        query = {"kind": kind, "normalized_value": normalized_value}
        if kind == "affiliation":
            query["relationship_type"] = relation
        await db.profile_terms.update_one(
            query,
            {
                "$set": {
                    "kind": kind,
                    "value": value,
                    "normalized_value": normalized_value,
                    "relationship_type": relation,
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )


def term_matches(value: str, query: str) -> bool:
    normalized_value = normalize_text(value)
    normalized_query = normalize_text(query)
    if not normalized_query:
        return True
    if normalized_query in normalized_value:
        return True
    return SequenceMatcher(None, normalized_query, normalized_value).ratio() >= 0.72


def term_score(value: str, query: str) -> tuple[int, str]:
    normalized_value = normalize_text(value)
    normalized_query = normalize_text(query)
    if not normalized_query:
        return (3, normalized_value)
    if normalized_value == normalized_query:
        return (0, normalized_value)
    if normalized_value.startswith(normalized_query):
        return (1, normalized_value)
    if normalized_query in normalized_value:
        return (2, normalized_value)
    return (3, normalized_value)
