"""Clear the configured MongoDB database and MinIO bucket, then seed curated content.

Run via ./reset-e-popular.sh to load backend/.env from the right directory.
The default mode previews the seed. --yes performs the destructive reset.
"""

from __future__ import annotations

import argparse
import asyncio
import secrets
from datetime import date
from pathlib import Path

from botocore.exceptions import ClientError
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import ValidationError

from core.config import settings
from core.profile_terms import upsert_default_profile_terms, upsert_profile_terms
from core.security import hash_password
from core.storage import _s3
from models.doc import DocCreate
from models.infrastructure import ClusterCreate
from models.project import ProjectCreate
from models.publication import PublicationCreate
from models.user import UserCreate
from routers.rooms import initialize_default_rooms
from scripts import image_uploader
from scripts.seed_blog import build_posts
from scripts.parsers import infrastructure, people, projects, publications

DOCS_DIR = Path(__file__).resolve().parent.parent / "seed_docs"


def load_docs() -> list[dict]:
    docs: list[dict] = []
    for source in sorted(DOCS_DIR.rglob("*.md")):
        path = source.relative_to(DOCS_DIR).as_posix()
        content = source.read_text(encoding="utf-8").strip()
        if not content:
            raise ValueError(f"Doc vazio: {source}")
        # Keep meeting dates stable; guides use their source modification date.
        updated_at = path.split("/")[-1][:10]
        try:
            date.fromisoformat(updated_at)
        except ValueError:
            updated_at = date.fromtimestamp(source.stat().st_mtime).isoformat()
        docs.append(DocCreate(path=path, content=content, updatedAt=updated_at).model_dump())
    if len([d for d in docs if d["path"].startswith("reunioes/")]) != 6:
        raise ValueError("Esperadas exatamente seis atas em seed_docs/reunioes/.")
    return docs


def prepare_content() -> dict[str, list[dict]]:
    required_images = [
        projects.IMG_DIR / "smart_lasdpc_architecture_v1.png",
        *(infrastructure.IMG_DIR / name for name in (
            "lasdpc_1006_1.jpg", "lasdpc_1006_2.jpg", "lasdpc_1006_3.jpg",
            "icmc_lasdpc_lab_1006.png", "lasdpc_1008_1.jpg",
            "lasdpc_1008_2.jpg", "lasdpc_1008_3.jpg",
            "icmc_lasdpc_lab_1008.png", "assets_icmc_lasdpc_labs.png",
        )),
    ]
    missing = [str(path) for path in required_images if not path.is_file()]
    if missing:
        raise ValueError(f"Imagens de origem ausentes: {', '.join(missing)}")
    docentes = people.parse_docentes()
    students = people.parse_active_students()
    if len(students) != 1 or students[0]["name"] != "Luiz Felipe Diniz Costa":
        raise ValueError("O seed deve ter apenas Luiz Felipe Diniz Costa como aluno.")
    students[0]["year_joined"] = 2024
    pubs = [publications._enrich(p) for p in publications.parse_smart_lasdpc()[:2]]
    data = {
        "docentes": docentes,
        "students": students,
        "publications": pubs,
        "projects": projects.parse_all(),
        "clusters": infrastructure.parse_all(),
        "blog_posts": build_posts(),
        "docs": load_docs(),
    }
    for project in data["projects"]:
        if project["title"] == "Smart-LaSDPC":
            project["publications"] = 2
    for item in docentes + students:
        # Passwords are added only during insertion.
        UserCreate(password="temporary", **item)
    for model, key in (
        (PublicationCreate, "publications"),
        (ProjectCreate, "projects"),
        (ClusterCreate, "clusters"),
    ):
        for item in data[key]:
            model(**item)
    return data


def require_admin_config() -> None:
    if not settings.admin_email or not settings.admin_password:
        raise ValueError("Defina ADMIN_EMAIL e ADMIN_PASSWORD em backend/.env para recriar o administrador.")
    if settings.admin_password in {"suaSenhaSegura", "changeme123", "change_me_to_a_strong_password"}:
        raise ValueError("Troque ADMIN_PASSWORD de exemplo antes do reset.")
    if not settings.minio_root_user or not settings.minio_root_password:
        raise ValueError("Defina MINIO_ROOT_USER e MINIO_ROOT_PASSWORD em backend/.env.")
    UserCreate(
        email=settings.admin_email,
        password=settings.admin_password,
        name=settings.admin_name.strip() or "Admin LASDPC",
        role="docente",
        initials="AL",
        is_admin=True,
    )


def ensure_bucket_available() -> None:
    try:
        _s3.head_bucket(Bucket=settings.minio_bucket)
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code")
        if code not in {"404", "NoSuchBucket"}:
            raise
        raise ValueError(
            f"Bucket {settings.minio_bucket} ausente. Execute docker compose up -d para que minio-init crie o bucket com acesso público."
        ) from exc


def clear_bucket() -> int:
    """Delete current objects and historical versions, keeping bucket policy intact."""
    bucket = settings.minio_bucket
    deleted = 0
    while True:
        page = _s3.list_object_versions(Bucket=bucket, MaxKeys=1000)
        objects = [
            {"Key": obj["Key"], "VersionId": obj["VersionId"]}
            for group in ("Versions", "DeleteMarkers")
            for obj in page.get(group, [])
        ]
        if not objects:
            break
        result = _s3.delete_objects(Bucket=bucket, Delete={"Objects": objects, "Quiet": True})
        if result.get("Errors"):
            raise RuntimeError(f"Falha ao remover objetos do MinIO: {result['Errors']}")
        deleted += len(objects)
    # Non-versioned buckets also need a current-object pass.
    while True:
        page = _s3.list_objects_v2(Bucket=bucket, MaxKeys=1000)
        objects = [{"Key": obj["Key"]} for obj in page.get("Contents", [])]
        if not objects:
            break
        result = _s3.delete_objects(Bucket=bucket, Delete={"Objects": objects, "Quiet": True})
        if result.get("Errors"):
            raise RuntimeError(f"Falha ao remover objetos do MinIO: {result['Errors']}")
        deleted += len(objects)
    return deleted


async def insert_person(db, raw: dict, password: str) -> dict:
    doc = {key: value for key, value in raw.items() if value is not None}
    doc.update({"hashed_password": hash_password(password), "is_admin": False, "avatar": None})
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    await upsert_profile_terms(db, doc)
    return doc


async def seed(db, data: dict[str, list[dict]]) -> str:
    image_uploader.ensure_bucket()

    def upload_required_image(path: Path, prefix: str) -> str:
        key = image_uploader.upload_local_image(path, prefix)
        if not key:
            raise RuntimeError(f"Upload da imagem falhou: {path}")
        return key

    data["projects"] = projects.parse_all(image_uploader=upload_required_image)
    data["clusters"] = infrastructure.parse_all(image_uploader=upload_required_image)
    for project in data["projects"]:
        if project["title"] == "Smart-LaSDPC":
            project["publications"] = 2
    await upsert_default_profile_terms(db)

    admin_name = settings.admin_name.strip() or "Admin LASDPC"
    parts = admin_name.split()
    await db.users.insert_one({
        "email": settings.admin_email,
        "name": admin_name,
        "role": "docente",
        "is_admin": True,
        "initials": (parts[0][0] + parts[-1][0]).upper(),
        "status": "active",
        "avatar": None,
        "hashed_password": hash_password(settings.admin_password),
    })

    by_name = {}
    for raw in data["docentes"]:
        person = await insert_person(db, raw, secrets.token_urlsafe(32))
        by_name[person["name"]] = str(person["_id"])

    # One initial password is emitted only to the local terminal.
    student_password = secrets.token_urlsafe(24)
    student = dict(data["students"][0])
    student["advisor_id"] = by_name.get(student.get("advisor_name"))
    await insert_person(db, student, student_password)

    for collection in ("publications", "projects", "clusters", "blog_posts", "docs"):
        if data[collection]:
            await db[collection].insert_many(data[collection])

    await initialize_default_rooms(db)
    return student_password


async def run(confirmed: bool) -> None:
    require_admin_config()
    data = prepare_content()
    print(f"Destino: banco MongoDB {settings.mongo_db_name} | bucket MinIO {settings.minio_bucket} em {settings.minio_endpoint}")
    print("Seed: " + ", ".join(f"{key}={len(items)}" for key, items in data.items()))
    print("Blog: dois posts novos baseados no projeto do site e no Smart-LaSDPC.")
    if not confirmed:
        print("Prévia apenas. Execute ./reset-e-popular.sh --yes para apagar e repopular.")
        return

    client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
    try:
        await client.admin.command("ping")
        ensure_bucket_available()
        db = client[settings.mongo_db_name]
        if any(p["email"].casefold() == settings.admin_email.casefold() for p in data["docentes"] + data["students"]):
            raise ValueError("ADMIN_EMAIL coincide com o email de uma pessoa do seed.")

        try:
            print("Apagando objetos do bucket configurado...")
            deleted = clear_bucket()
            print(f"Objetos/versões removidos: {deleted}")
            await client.drop_database(settings.mongo_db_name)
            print("Banco MongoDB apagado. Inserindo conteúdo...")
            student_password = await seed(db, data)
        except Exception:
            print("Reset interrompido. MongoDB e MinIO podem estar parcialmente populados; corrija o erro e execute novamente.")
            raise
        print(f"Concluído: {len(data['docentes'])} docentes, 1 aluno, 2 publicações, {len(data['blog_posts'])} posts, {len(data['docs'])} Docs.")
        print(f"Login inicial do aluno: {data['students'][0]['email']} | senha: {student_password}")
        print("Guarde a senha; ela não será exibida novamente.")
    finally:
        client.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--yes", action="store_true", help="Apaga o banco e o bucket configurados e executa o seed")
    args = parser.parse_args()
    try:
        asyncio.run(run(args.yes))
    except (ValueError, ValidationError) as exc:
        parser.exit(1, f"Erro: {exc}\n")


if __name__ == "__main__":
    main()
