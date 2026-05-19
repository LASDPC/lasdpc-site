"""Seed script: clears the database and repopulates it from the markdown
sources in `organizado/banco-de-dados/`.

Run from the backend directory:
    python -m scripts.seed              # full reseed (drops collections)
    python -m scripts.seed --no-drop    # additive (keeps existing docs)
    python -m scripts.seed --skip-images  # skip MinIO uploads

The admin user (where `is_admin: True`) is preserved across reseeds.
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
    """For every user with `advisor_name`, attempt to fill `advisor_id` by
    looking up the matching docente. Unmatched names stay as strings.
    """
    docentes = await db.users.find({"role": "docente"}).to_list(length=None)
    by_name = {d["name"]: str(d["_id"]) for d in docentes}
    unresolved = 0
    async for user in db.users.find({"advisor_name": {"$ne": None}, "role": {"$ne": "docente"}}):
        advisor = by_name.get(user.get("advisor_name") or "")
        if advisor:
            await db.users.update_one({"_id": user["_id"]}, {"$set": {"advisor_id": advisor}})
        else:
            unresolved += 1
    if unresolved:
        print(f"[!] {unresolved} alunos com advisor_name fora do corpo docente (preservados como string)")


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
        # Drop content collections entirely
        for coll in ("projects", "publications", "clusters", "blog_posts", "docs"):
            await db[coll].drop()
        # For users, preserve admins; remove everyone else
        deleted = await db.users.delete_many({"is_admin": {"$ne": True}})
        print(f"[-] Cleared collections (kept {await db.users.count_documents({})} admin user(s); removed {deleted.deleted_count} non-admins)")

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
    docentes_docs, others_docs = people.parse_everyone()
    await _insert_users(db, docentes_docs, "docentes")
    await _insert_users(db, others_docs, "alunos/alumni")
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

    print("\nSeed complete.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
