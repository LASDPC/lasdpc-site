"""Complete database rebuild from curated Markdown and Acacia cache sources.

Run from the backend directory:
    python -m scripts.seed              # full reseed (drops collections)
    python -m scripts.seed --no-drop    # additive (keeps existing docs)
    python -m scripts.seed --skip-images  # skip MinIO uploads

All application collections are cleared. Admin accounts are preserved so a
reseed cannot lock maintainers out.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

from core.config import settings
from core.profile_terms import upsert_default_profile_terms, upsert_profile_terms
from core.security import hash_password

from scripts import image_uploader
from scripts.parsers import infrastructure, people, projects, publications

DEFAULT_PASSWORD = "changeme123"


def _initials(name: str) -> str:
    parts = [p for p in name.strip().split() if p]
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper() if name else "??"


async def _insert_users(db, docs: list[dict], label: str) -> int:
    inserted = 0
    for raw in docs:
        doc = {k: v for k, v in raw.items() if v is not None}
        doc.setdefault("initials", _initials(doc.get("name", "")))
        doc.setdefault("status", "active")
        doc.setdefault("is_admin", False)
        doc.setdefault("avatar", None)
        doc["hashed_password"] = hash_password(DEFAULT_PASSWORD)
        result = await db.users.insert_one(doc)
        doc["_id"] = result.inserted_id
        await upsert_profile_terms(db, doc)
        inserted += 1
    print(f"[+] Inserted {inserted} {label}")
    return inserted


async def _resolve_advisor_ids(db) -> None:
    """Resolve o orientador do único aluno ativo adicional."""
    docentes = await db.users.find({"role": "docente"}).to_list(length=None)
    by_name = {docente["name"]: str(docente["_id"]) for docente in docentes}
    async for user in db.users.find({"role": "aluno_ativo", "advisor_name": {"$ne": None}}):
        advisor_id = by_name.get(user.get("advisor_name") or "")
        if advisor_id:
            await db.users.update_one({"_id": user["_id"]}, {"$set": {"advisor_id": advisor_id}})


async def main() -> None:
    drop = "--no-drop" not in sys.argv
    skip_images = "--skip-images" in sys.argv

    client = AsyncIOMotorClient(
        settings.mongo_uri,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
    )
    db = client[settings.mongo_db_name]

    if drop:
        # This is deliberately a complete rebuild, including operational data
        # such as notifications and room events. Preserve only administrators.
        admins = await db.users.find({"is_admin": True}).to_list(length=None)
        collections = await db.list_collection_names()
        for collection_name in collections:
            await db[collection_name].drop()
        if admins:
            await db.users.insert_many(admins)
        print(f"[-] Cleared {len(collections)} application collections; restored {len(admins)} admin account(s)")

    uploader = None
    if not skip_images:
        try:
            image_uploader.ensure_bucket()
            uploader = image_uploader.upload_local_image
            print("[+] MinIO bucket ready - image uploads enabled")
        except Exception as exc:
            print(
                f"[!] MinIO unavailable or credentials invalid ({exc}); "
                "continuing without image uploads. "
                "Tip: `docker compose down -v && docker compose up -d` "
                "to reset MinIO with the credentials in backend/.env."
            )
            uploader = None
    else:
        print("[i] --skip-images set; image uploads disabled")

    await upsert_default_profile_terms(db)

    # 1. Pessoas
    docentes_docs = people.parse_docentes()
    active_students = people.parse_active_students()
    if len(active_students) != 1 or active_students[0]["name"] != "Luiz Felipe Diniz Costa":
        raise ValueError("O seed deve ter somente Luiz Felipe Diniz Costa fora da genealogia.")
    await _insert_users(db, docentes_docs, "docentes")
    await _insert_users(db, active_students, "aluno ativo adicional")
    await _resolve_advisor_ids(db)

    # 2. Publicações
    pubs = publications.parse_all()
    if pubs:
        await db.publications.insert_many(pubs)
        print(f"[+] Inserted {len(pubs)} publications")

    # 3. Projetos
    project_docs = projects.parse_all(image_uploader=uploader)
    if project_docs:
        await db.projects.insert_many(project_docs)
        print(f"[+] Inserted {len(project_docs)} projects")

    # 4. Clusters
    cluster_docs = infrastructure.parse_all(image_uploader=uploader)
    if cluster_docs:
        await db.clusters.insert_many(cluster_docs)
        print(f"[+] Inserted {len(cluster_docs)} clusters")

    # 5. Genealogia Acadêmica
    genealogy_cache = Path(__file__).resolve().parent.parent / "data" / "genealogy_data.json"
    if genealogy_cache.exists():
        import json
        from scripts.sync_genealogy import correlate_with_lasdpc_users, upsert_direct_advisee_accounts

        with open(genealogy_cache, "r", encoding="utf-8") as f:
            gen_data = json.load(f)
        # Create one deduplicated, non-login profile for every verified direct
        # advisee, then attach stable internal ids to all genealogy nodes.
        await upsert_direct_advisee_accounts(db, gen_data)
        await correlate_with_lasdpc_users(db, gen_data)
        if gen_data.get("professors"):
            await db.genealogy_professors.insert_many(gen_data["professors"])
        if gen_data.get("nodes"):
            await db.genealogy_nodes.insert_many(gen_data["nodes"])
        if gen_data.get("edges"):
            await db.genealogy_edges.insert_many(gen_data["edges"])
        if gen_data.get("meta"):
            await db.genealogy_meta.insert_one({"_id": "current", "stats": gen_data["meta"]})
        print(f"[+] Seeded genealogy: {len(gen_data.get('nodes', []))} nodes, {len(gen_data.get('edges', []))} edges")

    print("\nSeed complete.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
