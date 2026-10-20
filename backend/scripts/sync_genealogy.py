"""Plataforma Acácia -> LaSDPC Academic Genealogy Synchronizer

Crawls academic genealogy data from Plataforma Acácia for LaSDPC professors,
parses topological metrics (Ds, Ig, Fc, Ft, G, R, Pr, percentiles),
gathers direct descendants (MSc, PhD, PostDoc, Co-orientations), correlates them
with local LaSDPC profiles, and persists to MongoDB and JSON cache.

Usage:
    # Run from backend directory:
    python -m scripts.sync_genealogy
    python scripts/sync_genealogy.py

    # Flags:
    --skip-mongo        Do not connect to MongoDB, only write JSON files
    --from-cache        Rebuild the direct-only dataset without network access
    --no-cache          Bypass existing cached downloads
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import secrets
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Path setups to allow standalone execution
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

try:
    from core.config import settings
    from motor.motor_asyncio import AsyncIOMotorClient
    HAS_CONFIG = True
except ImportError:
    HAS_CONFIG = False
    settings = None

DATA_DIR = BACKEND_DIR / "data"
FRONTEND_DATA_DIR = BACKEND_DIR.parent / "frontend" / "src" / "data"
CACHE_FILE = DATA_DIR / "genealogy_data.json"

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (LASDPC Genealogy Bot)"

DOCENTES_CONFIG = [
    {
        "slug": "julio-cezar-estrella",
        "name": "Júlio Cezar Estrella",
        "email": "jcezar@icmc.usp.br",
        "title": "Associate Professor",
        "titlePt": "Professor Associado",
    },
    {
        "slug": "marcos-jose-santana",
        "name": "Marcos José Santana",
        "email": "mjs@icmc.usp.br",
        "title": "Full Professor",
        "titlePt": "Professor Titular",
    },
    {
        "slug": "regina-helena-carlucci-santana",
        "name": "Regina Helena Carlucci Santana",
        "email": "rcs@icmc.usp.br",
        "title": "Full Professor",
        "titlePt": "Professora Titular",
    },
    {
        "slug": "paulo-sergio-lopes-de-souza",
        "name": "Paulo Sérgio Lopes de Souza",
        "email": "pssouza@icmc.usp.br",
        "title": "Associate Professor",
        "titlePt": "Professor Associado",
    },
    {
        "slug": "francisco-jose-monaco",
        "name": "Francisco José Monaco",
        "email": "monaco@icmc.usp.br",
        "title": "Associate Professor",
        "titlePt": "Professor Associado",
    },
    {
        "slug": "sarita-mazzini-bruschi",
        "name": "Sarita Mazzini Bruschi",
        "email": "sarita@icmc.usp.br",
        "title": "Associate Professor",
        "titlePt": "Professora Doutora",
    },
]


def _http_get(url: str, retries: int = 3, delay: float = 1.0) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_err = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                return resp.read().decode("utf-8")
        except Exception as exc:
            last_err = exc
            time.sleep(delay * (attempt + 1))
    raise RuntimeError(f"Failed to fetch {url} after {retries} retries: {last_err}")


def _http_get_json(url: str) -> dict[str, Any]:
    content = _http_get(url)
    return json.loads(content)


def _clean_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text).strip()


def parse_qualification(code: str) -> dict[str, Any]:
    """Parse Acácia qualification code like 'M2018', 'D2024Co', 'P2020'."""
    degree = "Outro"
    year = None
    is_coorientation = "Co" in code

    clean = code.replace("Co", "").strip()
    if clean.startswith("M"):
        degree = "Mestrado"
        raw_year = clean[1:]
    elif clean.startswith("D"):
        degree = "Doutorado"
        raw_year = clean[1:]
    elif clean.startswith("P"):
        degree = "Pós-Doutorado"
        raw_year = clean[1:]
    else:
        raw_year = clean

    if raw_year.isdigit() and len(raw_year) == 4:
        year = int(raw_year)

    return {
        "raw": code,
        "degree": degree,
        "degree_code": code[0] if code else "?",
        "year": year,
        "is_coorientation": is_coorientation,
    }


def parse_qualifications_html(html_snippet: str) -> list[dict[str, Any]]:
    """Parse the badges HTML snippet from relations/descendants table."""
    results = []
    # Match tags: <span class="tag is-m">M</span> ... 2024 ... <span class="badge ...">Co</span>
    # Or find all control blocks
    controls = re.findall(r'<div class="control">(.*?)</div>\s*</div>', html_snippet, re.DOTALL)
    for c in controls:
        level_m = re.search(r'class="tag is-([mdp])">([MDP])</span>', c, re.IGNORECASE)
        year_m = re.search(r'class="tag is-year[^"]*">\s*(\d{4})', c)
        co_m = re.search(r'is-danger[^"]*">Co</span>', c)

        degree_code = level_m.group(2).upper() if level_m else "M"
        degree_map = {"M": "Mestrado", "D": "Doutorado", "P": "Pós-Doutorado"}
        degree = degree_map.get(degree_code, "Outro")
        year = int(year_m.group(1)) if year_m else None
        is_co = bool(co_m)

        results.append({
            "raw": f"{degree_code}{year or ''}{'Co' if is_co else ''}",
            "degree": degree,
            "degree_code": degree_code,
            "year": year,
            "is_coorientation": is_co,
        })
    return results


def crawl_acacia_professor(slug: str, base_name: str) -> dict[str, Any]:
    """Crawl a single professor profile, metrics, tables and graph connections."""
    print(f"[*] Crawling Plataforma Acácia for {base_name} ({slug})...")

    # 1. Profile HTML
    profile_url = f"https://plataforma-acacia.org/profile/{slug}/"
    html = _http_get(profile_url)

    # Lattes ID
    lattes_match = re.search(r"lattes\.cnpq\.br/(\d+)", html)
    lattes_id = lattes_match.group(1) if lattes_match else None

    # Topological Metrics from select options
    metric_options = dict(
        re.findall(r'<option[^>]*value="([^"]+)"[^>]*data-metric-value="([^"]+)"', html)
    )
    # Mapping
    # gi: Índice Genealógico, dp: Descendência, fcp: Fecundidade, ftp: Fertilidade, gp: Gerações, rp: Relações, cp: Primos
    metrics_summary = {
        "genealogical_index": int(metric_options.get("gi", 0)),
        "descendants_count": int(metric_options.get("dp", 0)),
        "fecundity": int(metric_options.get("fcp", 0)),
        "fertility": int(metric_options.get("ftp", 0)),
        "generations": int(metric_options.get("gp", 0)),
        "relationships": int(metric_options.get("rp", 0)),
        "cousins": int(metric_options.get("cp", 0)),
    }

    # Percentiles JSON
    metrics_data_raw = re.search(r'<script id="metrics-data"[^>]*>(.*?)</script>', html, re.DOTALL)
    percentiles = json.loads(metrics_data_raw.group(1)) if metrics_data_raw else {}

    # Area breakdowns
    def _extract_json_script(script_id: str) -> Any:
        m = re.search(rf'<script id="{script_id}"[^>]*>(.*?)</script>', html, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(1))
            except Exception:
                return []
        return []

    asc_major = _extract_json_script("profile-asc-major-data")
    asc_areas = _extract_json_script("profile-asc-area-data")
    asc_timeline = _extract_json_script("profile-asc-timeline-data")
    desc_major = _extract_json_script("profile-desc-major-data")
    desc_areas = _extract_json_script("profile-desc-area-data")
    desc_timeline = _extract_json_script("profile-desc-timeline-data")

    # 2. Relations Descendants Table (complete list of direct advisees with exact qualifications & metrics)
    relations_url = f"https://plataforma-acacia.org/profile/{slug}/relations/descendants/?length=300"
    relations_json = _http_get_json(relations_url)
    raw_table = relations_json.get("data", [])

    direct_advisees: list[dict[str, Any]] = []
    for row in raw_table:
        # row schema: [index, link_html, badges_html, ds, ig, fc, ft, g, r, pr]
        if len(row) < 10:
            continue
        link_html = row[1]
        badges_html = row[2]

        slug_m = re.search(r'href="/profile/([^/]+)/"', link_html)
        student_slug = slug_m.group(1) if slug_m else ""
        student_name = _clean_html(link_html)

        quals = parse_qualifications_html(badges_html)

        advisee_data = {
            "name": student_name,
            "slug": student_slug,
            "profile_url": f"https://plataforma-acacia.org/profile/{student_slug}/" if student_slug else "",
            "qualifications": quals,
            "metrics": {
                "descendants_count": row[3],
                "genealogical_index": row[4],
                "fecundity": row[5],
                "fertility": row[6],
                "generations": row[7],
                "relationships": row[8],
                "cousins": row[9],
            },
        }
        direct_advisees.append(advisee_data)

    # 3. Descendants Graph API (contains node IDs and edges)
    graph_desc_url = f"https://plataforma-acacia.org/profile/{slug}/graph/descendants/"
    graph_desc = _http_get_json(graph_desc_url)

    center = graph_desc.get("center", {})
    center_id = str(center.get("id", slug))

    # If there are more nodes via offset pagination, fetch them
    all_graph_nodes = list(graph_desc.get("nodes", []))
    all_graph_edges = list(graph_desc.get("edges", []))
    next_offset = graph_desc.get("next_offset")

    while next_offset is not None:
        paged_url = f"https://plataforma-acacia.org/profile/{slug}/graph/descendants/?offset={next_offset}"
        paged_data = _http_get_json(paged_url)
        all_graph_nodes.extend(paged_data.get("nodes", []))
        all_graph_edges.extend(paged_data.get("edges", []))
        next_offset = paged_data.get("next_offset")

    return {
        "slug": slug,
        "name": center.get("name") or base_name,
        "acacia_id": center_id,
        "area": center.get("area", "Ciência da Computação"),
        "lattes_id": lattes_id,
        "lattes_url": f"http://lattes.cnpq.br/{lattes_id}" if lattes_id else None,
        "profile_url": profile_url,
        "metrics": metrics_summary,
        "percentiles": percentiles,
        "areas": {
            "asc_major": asc_major,
            "asc_areas": asc_areas,
            "desc_major": desc_major,
            "desc_areas": desc_areas,
        },
        "timelines": {
            "asc_timeline": asc_timeline,
            "desc_timeline": desc_timeline,
        },
        "direct_advisees": direct_advisees,
        "graph_descendants": {
            "nodes": all_graph_nodes,
            "edges": all_graph_edges,
        },
    }


def enrich_direct_advisee_profiles(professors_data: list[dict[str, Any]]) -> None:
    """Recover profile-level data that is absent from Acacia's relation table.

    The relation endpoint is the source of truth for the direct relationship.
    Individual profile pages are only used to add public identifiers such as
    Lattes. Failures never remove an already verified relationship.
    """
    by_slug: dict[str, list[dict[str, Any]]] = {}
    for professor in professors_data:
        for advisee in professor.get("direct_advisees", []):
            slug = advisee.get("slug")
            if slug:
                by_slug.setdefault(slug, []).append(advisee)

    print(f"[*] Enriching {len(by_slug)} unique direct advisee profiles...")
    consecutive_failures = 0
    for index, (slug, copies) in enumerate(by_slug.items(), 1):
        try:
            html = _http_get(f"https://plataforma-acacia.org/profile/{slug}/", retries=2, delay=.4)
            lattes_match = re.search(r"lattes\.cnpq\.br/(\d+)", html)
            enrichment = {
                "lattes_id": lattes_match.group(1) if lattes_match else None,
                "lattes_url": f"http://lattes.cnpq.br/{lattes_match.group(1)}" if lattes_match else None,
            }
            for advisee in copies:
                advisee.update({key: value for key, value in enrichment.items() if value})
            consecutive_failures = 0
        except Exception as exc:
            consecutive_failures += 1
            print(f"    [!] {index}/{len(by_slug)} {slug}: {exc}")
            # Cloudflare or an outage usually affects every profile. Stop early
            # and retain the relation/graph data already collected.
            if consecutive_failures >= 3:
                print("[!] Profile enrichment unavailable; keeping verified relation data.")
                break


async def correlate_with_lasdpc_users(db, unified: dict[str, Any]) -> None:
    """Check if any node in the genealogy corresponds to a user in the local
    LaSDPC MongoDB database, attaching user_id, photo, and internal profile link.
    """
    if db is None:
        return

    all_nodes = unified["nodes"]
    edges = unified["edges"]
    professors = unified["professors"]
    users = await db.users.find({}, {
        "_id": 1,
        "name": 1,
        "email": 1,
        "role": 1,
        "photo": 1,
        "lattes": 1,
    }).to_list(length=None)
    name_to_user = {}
    lattes_to_user = {}

    for u in users:
        u_name_norm = _normalize_name(u.get("name", ""))
        name_to_user[u_name_norm] = u
        u_lattes = u.get("lattes", "")
        if u_lattes:
            l_match = re.search(r"lattes\.cnpq\.br/(\d+)", u_lattes)
            if l_match:
                lattes_to_user[l_match.group(1)] = u

    professors_by_id = {str(item["acacia_id"]): item for item in professors}
    matched = 0
    for node in all_nodes:
        norm = _normalize_name(node.get("name", ""))
        lattes = node.get("lattes_id")
        user = None
        if lattes and lattes in lattes_to_user:
            user = lattes_to_user[lattes]
        elif norm in name_to_user:
            user = name_to_user[norm]

        if user:
            node["is_lasdpc_member"] = True
            node["lasdpc_user_id"] = str(user["_id"])
            node["lasdpc_role"] = user.get("role")
            if user.get("photo"):
                node["avatar"] = user["photo"]

            incoming = [edge for edge in edges if str(edge.get("target")) == str(node.get("id"))]
            relationships = []
            for edge in incoming:
                advisor = professors_by_id.get(str(edge.get("source")))
                if not advisor:
                    continue
                relationships.append({
                    "advisor_name": advisor.get("name"),
                    "advisor_slug": advisor.get("slug"),
                    "degree": edge.get("degree"),
                    "degree_code": edge.get("degree_code"),
                    "year": edge.get("year"),
                    "is_coorientation": bool(edge.get("is_coorientation")),
                })

            genealogy_profile = {
                "acacia_id": str(node.get("id")),
                "slug": node.get("slug"),
                "profile_url": node.get("profile_url"),
                "metrics": node.get("metrics") or {},
                "qualifications": node.get("table_qualifications") or [],
                "relationships": relationships,
                "is_faculty_root": bool(node.get("is_docente")),
                "source": "Plataforma Acácia",
            }
            update_fields: dict[str, Any] = {"academic_genealogy": genealogy_profile}
            if not user.get("lattes") and node.get("lattes_url"):
                update_fields["lattes"] = node["lattes_url"]
            await db.users.update_one({"_id": user["_id"]}, {"$set": update_fields})
            matched += 1

    print(f"[+] Correlated {matched} genealogy nodes with local LaSDPC lab members.")


def _normalize_name(name: str) -> str:
    import unicodedata
    n = unicodedata.normalize("NFKD", name).encode("ASCII", "ignore").decode("utf-8")
    return " ".join(n.lower().split())


def build_unified_graph(professors_data: list[dict[str, Any]]) -> dict[str, Any]:
    """Build the public graph from faculty roots and verified direct advisees.

    Acacia's descendants graph also contains later generations.  Those nodes
    are useful for Acacia's own topology metrics, but they must not become
    LaSDPC people or public relationships.  The relation table identifies the
    direct advisees, so only its entries are materialized here.
    """
    nodes_by_id: dict[str, dict[str, Any]] = {}
    edges_set: set[tuple[str, str, str]] = set()
    edges_list: list[dict[str, Any]] = []

    # 1. Register professors first
    for prof in professors_data:
        p_id = str(prof["acacia_id"])
        nodes_by_id[p_id] = {
            "id": p_id,
            "name": prof["name"],
            "slug": prof["slug"],
            "area": prof["area"],
            "lattes_id": prof["lattes_id"],
            "lattes_url": prof["lattes_url"],
            "profile_url": prof["profile_url"],
            "is_docente": True,
            "is_lasdpc_member": True,
            "generation": 0,
            "metrics": prof["metrics"],
            "neighbors": prof["metrics"]["descendants_count"],
        }

    # 2. Add only direct advisees named by the relation table. Graph data is
    # used exclusively to recover stable Acacia ids and areas for those names.
    for prof in professors_data:
        p_id = str(prof["acacia_id"])
        graph_by_slug = {
            item.get("slug"): item
            for item in prof.get("graph_descendants", {}).get("nodes", [])
            if item.get("slug")
        }
        for t_adv in prof.get("direct_advisees", []):
            t_slug = t_adv.get("slug")
            if not t_slug:
                continue
            graph_node = graph_by_slug.get(t_slug, {})
            advisee_id = str(graph_node.get("id") or t_adv.get("acacia_id") or f"acacia-slug:{t_slug}")
            t_adv["acacia_id"] = advisee_id
            if graph_node.get("area") and not t_adv.get("area"):
                t_adv["area"] = graph_node["area"]
            current = nodes_by_id.get(advisee_id, {})
            is_faculty_node = bool(current.get("is_docente"))
            merged_qualifications: list[dict[str, Any]] = []
            qualification_keys: set[tuple[Any, ...]] = set()
            for item in [*(current.get("table_qualifications") or []), *(t_adv.get("qualifications") or [])]:
                key = (item.get("raw"), item.get("degree_code"), item.get("year"), bool(item.get("is_coorientation")))
                if key not in qualification_keys:
                    qualification_keys.add(key)
                    merged_qualifications.append(item)
            nodes_by_id[advisee_id] = {
                **current,
                "id": advisee_id,
                "name": t_adv.get("name") or graph_node.get("name"),
                "slug": t_slug,
                "area": graph_node.get("area") or t_adv.get("area") or current.get("area") or None,
                "lattes_id": t_adv.get("lattes_id") or current.get("lattes_id"),
                "lattes_url": t_adv.get("lattes_url") or current.get("lattes_url"),
                "is_docente": is_faculty_node,
                "generation": 0 if is_faculty_node else 1,
                "profile_url": current.get("profile_url") or t_adv.get("profile_url"),
                "metrics": current.get("metrics") if is_faculty_node else (t_adv.get("metrics") or current.get("metrics") or {}),
                "table_qualifications": merged_qualifications,
                "neighbors": t_adv.get("metrics", {}).get("descendants_count", 0),
            }

            for qualification in t_adv.get("qualifications", []):
                parsed_q = qualification if isinstance(qualification, dict) else parse_qualification(qualification)
                key = (p_id, advisee_id, str(parsed_q.get("raw", "")))
                if key not in edges_set:
                    edges_set.add(key)
                    edges_list.append({
                        "source": p_id,
                        "target": advisee_id,
                        "degree": parsed_q.get("degree", "Outro"),
                        "degree_code": parsed_q.get("degree_code", "?"),
                        "year": parsed_q.get("year"),
                        "is_coorientation": bool(parsed_q.get("is_coorientation")),
                        "raw_code": parsed_q.get("raw"),
                    })

    # Calculate statistics
    total_nodes = len(nodes_by_id)
    total_edges = len(edges_list)
    msc_count = sum(1 for e in edges_list if e.get("degree_code") == "M")
    phd_count = sum(1 for e in edges_list if e.get("degree_code") == "D")
    co_count = sum(1 for e in edges_list if e.get("is_coorientation"))

    stats = {
        "total_nodes": total_nodes,
        "total_edges": total_edges,
        "total_docentes": len(professors_data),
        "masters_degrees": msc_count,
        "doctorate_degrees": phd_count,
        "coorientations": co_count,
        "total_descendants_accumulated": len({edge["target"] for edge in edges_list}),
        "direct_advisees_total": len({edge["target"] for edge in edges_list}),
        "last_sync_utc": datetime.now(timezone.utc).isoformat(),
    }

    public_professors = [
        {key: value for key, value in professor.items() if key not in {"graph_descendants", "graph_ancestors"}}
        for professor in professors_data
    ]

    return {
        "stats": stats,
        "nodes": list(nodes_by_id.values()),
        "edges": edges_list,
        "professors": public_professors,
    }


async def upsert_direct_advisee_accounts(db, unified: dict[str, Any]) -> dict[str, int]:
    """Create one safe local profile for every unique direct advisee.

    Existing curated accounts win over imported data. Imported accounts use a
    non-routable address and a random unknown password; an administrator must
    explicitly claim/activate login access for the person later.
    """
    if db is None:
        return {"created": 0, "updated": 0}

    from core.profile_terms import upsert_profile_terms
    from core.security import hash_password

    professor_by_id = {str(item["acacia_id"]): item for item in unified["professors"]}
    incoming_by_target: dict[str, list[dict[str, Any]]] = {}
    for edge in unified["edges"]:
        incoming_by_target.setdefault(str(edge["target"]), []).append(edge)

    existing_users = await db.users.find({}).to_list(length=None)
    by_name = {_normalize_name(user.get("name", "")): user for user in existing_users}
    by_lattes: dict[str, dict[str, Any]] = {}
    professor_users: dict[str, dict[str, Any]] = {}
    for user in existing_users:
        lattes_match = re.search(r"lattes\.cnpq\.br/(\d+)", user.get("lattes") or "")
        if lattes_match:
            by_lattes[lattes_match.group(1)] = user
        if user.get("role") == "docente":
            professor_users[_normalize_name(user.get("name", ""))] = user

    degree_priority = {"P": 3, "D": 2, "M": 1}
    degree_labels = {
        "P": ("Post-Doc", "Pós-doutorado"),
        "D": ("PhD", "Doutorado"),
        "M": ("MSc", "Mestrado"),
    }
    created = 0
    updated = 0

    for node in unified["nodes"]:
        if node.get("is_docente") or node.get("generation") != 1:
            continue
        node_id = str(node["id"])
        relationships = []
        for edge in sorted(incoming_by_target.get(node_id, []), key=lambda item: (item.get("year") or 0, item.get("degree_code") or "")):
            professor = professor_by_id.get(str(edge["source"]))
            if not professor:
                continue
            relationships.append({
                "advisor_name": professor.get("name"),
                "advisor_slug": professor.get("slug"),
                "degree": edge.get("degree"),
                "degree_code": edge.get("degree_code"),
                "year": edge.get("year"),
                "is_coorientation": bool(edge.get("is_coorientation")),
            })

        lattes_id = node.get("lattes_id")
        existing = by_lattes.get(lattes_id) if lattes_id else None
        existing = existing or by_name.get(_normalize_name(node.get("name", "")))
        qualifications = node.get("table_qualifications") or []
        degree_codes = [item.get("degree_code") for item in relationships + qualifications if item.get("degree_code")]
        highest_code = max(degree_codes, key=lambda value: degree_priority.get(value, 0), default=None)
        level, level_pt = degree_labels.get(highest_code, (None, None))
        years = [item.get("year") for item in relationships + qualifications if isinstance(item.get("year"), int)]
        graduation_year = max(years, default=None)
        advisor_names = list(dict.fromkeys(item["advisor_name"] for item in relationships if item.get("advisor_name")))
        primary_advisor = advisor_names[0] if advisor_names else None
        primary_advisor_user = professor_users.get(_normalize_name(primary_advisor or ""))
        genealogy_profile = {
            "acacia_id": node_id,
            "slug": node.get("slug"),
            "profile_url": node.get("profile_url"),
            "metrics": node.get("metrics") or {},
            "qualifications": qualifications,
            "relationships": relationships,
            "is_faculty_root": False,
            "source": "Plataforma Acácia",
        }

        imported_fields = {
            "academic_genealogy": genealogy_profile,
            "import_source": "plataforma_acacia",
            "account_claim_required": True,
        }
        optional_fields = {
            "lattes": node.get("lattes_url"),
            "area": node.get("area"),
            "areaPt": node.get("area"),
            "research_areas": [node["area"]] if node.get("area") else None,
            "level": level,
            "levelPt": level_pt,
            "advisor_name": primary_advisor,
            "advisor_id": str(primary_advisor_user["_id"]) if primary_advisor_user else None,
            "graduation_year": graduation_year,
            "exit_date": f"{graduation_year}-12-31" if graduation_year else None,
            "lab_relationship_type": "academic_advisor",
            "affiliation_name": "LaSDPC / ICMC-USP",
        }

        if existing:
            updates = {"academic_genealogy": genealogy_profile}
            for key, value in optional_fields.items():
                if value is not None and not existing.get(key):
                    updates[key] = value
            await db.users.update_one({"_id": existing["_id"]}, {"$set": updates})
            user_id = existing["_id"]
            updated += 1
        else:
            email_id = re.sub(r"[^a-zA-Z0-9]+", "-", node_id).strip("-").lower()
            doc = {
                "email": f"acacia-{email_id}@profiles.invalid",
                "hashed_password": hash_password(secrets.token_urlsafe(48)),
                "name": node.get("name"),
                "role": "alumni",
                "is_admin": False,
                "initials": "".join(part[0] for part in (node.get("name") or "").split()[:2]).upper() or "??",
                "status": "active",
                "avatar": None,
                "photo": None,
                "lgpd_consent": False,
                **imported_fields,
                **{key: value for key, value in optional_fields.items() if value is not None},
            }
            result = await db.users.insert_one(doc)
            doc["_id"] = result.inserted_id
            await upsert_profile_terms(db, doc)
            existing = doc
            user_id = result.inserted_id
            by_name[_normalize_name(doc["name"])] = doc
            if lattes_id:
                by_lattes[lattes_id] = doc
            created += 1

        node["is_lasdpc_member"] = True
        node["lasdpc_user_id"] = str(user_id)
        node["lasdpc_role"] = existing.get("role", "alumni")

    print(f"[+] Direct advisee profiles: {created} created, {updated} enriched.")
    return {"created": created, "updated": updated}


async def sync_all(
    skip_mongo: bool = False,
    no_cache: bool = False,
    from_cache: bool = False,
    enrich_advisees: bool = True,
) -> dict[str, Any]:
    """Execute complete synchronization."""
    t0 = time.time()
    print("==============================================================")
    print("  LaSDPC Academic Genealogy Synchronizer — Plataforma Acácia  ")
    print("==============================================================")

    # 1. Read the previous verified relation table when explicitly requested.
    cached: dict[str, Any] = {}
    if CACHE_FILE.exists() and not no_cache:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            cached = json.load(f)
        print(f"[i] Existing cache date: {cached.get('meta', {}).get('last_sync_utc')}")

    # 2. Crawl faculty roots, or rebuild a direct-only export from the cache.
    if from_cache:
        professors_data = cached.get("professors", [])
        if not professors_data:
            raise RuntimeError("--from-cache requires backend/data/genealogy_data.json with professor relation data")
        print(f"[*] Rebuilding from {len(professors_data)} cached faculty roots.")
    else:
        professors_data: list[dict[str, Any]] = []
        for doc in DOCENTES_CONFIG:
            p_data = crawl_acacia_professor(doc["slug"], doc["name"])
            p_data["title"] = doc["title"]
            p_data["titlePt"] = doc["titlePt"]
            p_data["email"] = doc["email"]
            professors_data.append(p_data)
        if enrich_advisees:
            enrich_direct_advisee_profiles(professors_data)

    # 3. Materialize exactly one generation below the LaSDPC faculty roots.
    unified = build_unified_graph(professors_data)

    # 5. Connect to MongoDB and correlate with lab members
    db = None
    client = None
    if not skip_mongo and HAS_CONFIG:
        try:
            client = AsyncIOMotorClient(
                settings.mongo_uri,
                serverSelectionTimeoutMS=4000,
                connectTimeoutMS=4000,
            )
            db = client[settings.mongo_db_name]
            # Ping
            await db.command("ping")
            print(f"[+] Connected to MongoDB at {settings.mongo_uri} (db: {settings.mongo_db_name})")
        except Exception as exc:
            print(f"[!] MongoDB not reachable ({exc}). Will proceed with JSON storage only.")
            db = None

    if db is not None:
        await upsert_direct_advisee_accounts(db, unified)
        await correlate_with_lasdpc_users(db, unified)

        # Persist to MongoDB collections
        print("[*] Saving to MongoDB collections: genealogy_professors, genealogy_nodes, genealogy_edges, genealogy_meta...")
        await db.genealogy_professors.delete_many({})
        if unified["professors"]:
            await db.genealogy_professors.insert_many([dict(p) for p in unified["professors"]])

        await db.genealogy_nodes.delete_many({})
        if unified["nodes"]:
            await db.genealogy_nodes.insert_many([dict(n) for n in unified["nodes"]])

        await db.genealogy_edges.delete_many({})
        if unified["edges"]:
            await db.genealogy_edges.insert_many([dict(e) for e in unified["edges"]])

        await db.genealogy_meta.delete_many({})
        meta_doc = {
            "_id": "current",
            "stats": unified["stats"],
            "last_synced_at": datetime.now(timezone.utc),
            "professors_count": len(unified["professors"]),
            "nodes_count": len(unified["nodes"]),
            "edges_count": len(unified["edges"]),
        }
        await db.genealogy_meta.insert_one(meta_doc)
        print("[+] MongoDB collections populated successfully!")

    if client:
        client.close()

    # 6. Save JSON cache files (backend & frontend)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    FRONTEND_DATA_DIR.mkdir(parents=True, exist_ok=True)

    export_payload = {
        "meta": unified["stats"],
        "professors": unified["professors"],
        "nodes": unified["nodes"],
        "edges": unified["edges"],
    }

    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(export_payload, f, ensure_ascii=False, indent=2)
    print(f"[+] Saved backend JSON cache to {CACHE_FILE}")

    frontend_file = FRONTEND_DATA_DIR / "genealogy_data.json"
    try:
        with open(frontend_file, "w", encoding="utf-8") as f:
            json.dump(export_payload, f, ensure_ascii=False, indent=2)
        print(f"[+] Saved frontend fallback JSON to {frontend_file}")
    except Exception as exc:
        print(f"[!] Warning saving to frontend: {exc}")

    elapsed = time.time() - t0
    print(f"\n[DONE] Genealogy sync finished in {elapsed:.2f}s!")
    print(f"       Total nodes: {len(unified['nodes'])}, Edges: {len(unified['edges'])}")
    print(f"       Direct advisees: {unified['stats']['direct_advisees_total']}")
    print(f"       MSc: {unified['stats']['masters_degrees']}, PhD: {unified['stats']['doctorate_degrees']}")
    return export_payload


def main():
    parser = argparse.ArgumentParser(description="Synchronize Academic Genealogy from Plataforma Acácia")
    parser.add_argument("--skip-mongo", action="store_true", help="Skip MongoDB operations, write JSON only")
    parser.add_argument("--no-cache", action="store_true", help="Bypass local cache")
    parser.add_argument("--from-cache", action="store_true", help="Rebuild the direct-only dataset from the last verified cache")
    parser.add_argument("--skip-advisee-profiles", action="store_true", help="Skip optional Lattes enrichment for direct advisees")
    args = parser.parse_args()

    asyncio.run(sync_all(
        skip_mongo=args.skip_mongo,
        no_cache=args.no_cache,
        from_cache=args.from_cache,
        enrich_advisees=not args.skip_advisee_profiles,
    ))


if __name__ == "__main__":
    main()
