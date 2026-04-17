"""Seed script: populates MongoDB with sample content data from frontend JSON mocks.

Run from the backend directory:
    python -m scripts.seed

Note: This script only seeds content data (projects, publications, etc.).
To create the admin user, use the POST /api/v1/users/bootstrap route or set
ADMIN_EMAIL/ADMIN_PASSWORD env vars.
"""

import asyncio
import json
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

from core.config import settings
from core.security import hash_password

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "data"

DEFAULT_PASSWORD = "changeme123"


def _initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper()


async def main():
    client = AsyncIOMotorClient(
        settings.mongo_uri,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
    )
    db = client[settings.mongo_db_name]

    # --- Seed content collections from JSON files ---
    collections_map = {
        "projects": "MOCKED_PROJECTS.json",
        "publications": "MOCKED_PUBLICATIONS.json",
        "blog_posts": "MOCKED_BLOG.json",
        "docs": "MOCKED_DOCS.json",
    }

    for collection_name, filename in collections_map.items():
        filepath = DATA_DIR / filename
        if not filepath.exists():
            print(f"[!] File not found: {filepath}")
            continue

        count = await db[collection_name].count_documents({})
        if count > 0:
            print(f"[=] {collection_name} already has {count} documents, skipping")
            continue

        with open(filepath) as f:
            data = json.load(f)

        for doc in data:
            doc.pop("id", None)

        await db[collection_name].insert_many(data)
        print(f"[+] Inserted {len(data)} documents into {collection_name}")

    # --- Seed infrastructure (clusters) ---
    infra_file = DATA_DIR / "MOCKED_INFRASTRUCTURE.json"
    if infra_file.exists():
        count = await db.clusters.count_documents({})
        if count > 0:
            print(f"[=] clusters already has {count} documents, skipping")
        else:
            with open(infra_file) as f:
                infra_data = json.load(f)
            clusters = infra_data.get("clusters", [])
            for c in clusters:
                c.pop("id", None)
            if clusters:
                await db.clusters.insert_many(clusters)
                print(f"[+] Inserted {len(clusters)} documents into clusters")

    # --- Seed people (docentes + students) into users collection ---
    user_count = await db.users.count_documents({"role": {"$in": ["docente", "aluno_ativo", "alumni"]}})
    if user_count > 0:
        print(f"[=] users already has {user_count} people, skipping docentes/students seed")
    else:
        inserted = 0
        # Docentes
        docentes_file = DATA_DIR / "MOCKED_DOCENTES.json"
        if docentes_file.exists():
            with open(docentes_file) as f:
                docentes = json.load(f)
            for d in docentes:
                d.pop("id", None)
                email = d.pop("email", f"{d['name'].split()[0].lower()}@icmc.usp.br")
                doc = {
                    "email": email,
                    "hashed_password": hash_password(DEFAULT_PASSWORD),
                    "name": d["name"],
                    "role": "docente",
                    "is_admin": False,
                    "avatar": None,
                    "initials": _initials(d["name"]),
                    "status": "active",
                    "title": d.get("role"),
                    "titlePt": d.get("rolePt"),
                    "area": d.get("area"),
                    "areaPt": d.get("areaPt"),
                    "lattes": d.get("lattes"),
                    "orcid": d.get("orcid"),
                    "scholar": d.get("scholar"),
                    "page": d.get("page"),
                    "photo": d.get("photo"),
                }
                existing = await db.users.find_one({"email": email})
                if not existing:
                    await db.users.insert_one(doc)
                    inserted += 1

        # Students
        students_file = DATA_DIR / "MOCKED_STUDENTS.json"
        if students_file.exists():
            with open(students_file) as f:
                students = json.load(f)
            for s in students:
                s.pop("id", None)
                name = s["name"]
                email = f"{name.split()[0].lower()}@usp.br"
                level = s.get("level", "")
                role = "alumni" if level.lower() == "alumni" else "aluno_ativo"
                doc = {
                    "email": email,
                    "hashed_password": hash_password(DEFAULT_PASSWORD),
                    "name": name,
                    "role": role,
                    "is_admin": False,
                    "avatar": None,
                    "initials": _initials(name),
                    "status": "active",
                    "area": s.get("area"),
                    "areaPt": s.get("areaPt"),
                    "level": s.get("level"),
                    "levelPt": s.get("levelPt"),
                }
                existing = await db.users.find_one({"email": email})
                if not existing:
                    await db.users.insert_one(doc)
                    inserted += 1

        print(f"[+] Inserted {inserted} people into users collection")

    print("\nSeed complete!")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
