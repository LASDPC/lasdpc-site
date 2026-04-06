"""Seed script: populates MongoDB with sample content data from frontend JSON mocks.

Run from the backend directory:
    python -m scripts.seed

Note: This script only seeds content data (projects, publications, etc.).
To create the admin user, use the POST /api/v1/users/bootstrap route.
"""

import asyncio
import json
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

from core.config import settings

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "data"


async def main():
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db_name]

    # --- Seed collections from JSON files ---
    collections_map = {
        "projects": "MOCKED_PROJECTS.json",
        "publications": "MOCKED_PUBLICATIONS.json",
        "blog_posts": "MOCKED_BLOG.json",
        "docentes": "MOCKED_DOCENTES.json",
        "students": "MOCKED_STUDENTS.json",
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

        # Remove 'id' field from documents (MongoDB uses _id)
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

    print("\nSeed complete!")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
