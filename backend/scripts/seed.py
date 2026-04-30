"""Seed script: populates MongoDB with sample content data from frontend JSON mocks.

Run from the backend directory:
    python -m scripts.seed

Note: This script only seeds content data (projects, publications, etc.).
To create the admin user, use the POST /api/v1/users/bootstrap route or set
ADMIN_EMAIL/ADMIN_PASSWORD env vars.
"""

import asyncio
import json
import re
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

from core.config import settings
from core.security import hash_password

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "data"

DEFAULT_PASSWORD = "changeme123"


ENRICHED_DOCENTES = [
    {
        "email": "pssouza@icmc.usp.br",
        "name": "Prof. Dr. Paulo Sérgio Lopes de Souza",
        "title": "Associate Professor",
        "titlePt": "Professor Associado",
        "area": "High-Performance Computing, Process Scheduling, Concurrent Programming",
        "areaPt": "Computação de Alto Desempenho, Escalonamento de Processos, Programação Concorrente",
        "lattes": "http://lattes.cnpq.br/4254001833729264",
        "orcid": None,
        "scholar": None,
        "page": "https://sites.icmc.usp.br/pssouza/",
        "photo": None,
        "bio": (
            "Paulo Sergio Lopes de Souza is an Associate Professor at ICMC/USP and a member "
            "of LASDPC. His work focuses on high-performance computing, process scheduling, "
            "operating systems, distributed systems, and testing of concurrent programs."
        ),
        "bioPt": (
            "Paulo Sérgio Lopes de Souza é Professor Associado do ICMC/USP e membro do LASDPC. "
            "Sua atuação envolve computação de alto desempenho, escalonamento de processos, "
            "sistemas operacionais, sistemas distribuídos e teste de programas concorrentes."
        ),
        "research_areas": [
            "High-Performance Computing",
            "Concurrent Programming",
            "Operating Systems",
            "Distributed Systems",
            "Software Testing",
        ],
        "year_joined": 2005,
        "skills": ["HPC", "Operating Systems", "Distributed Systems", "Parallel Programming", "Software Testing"],
    },
    {
        "email": "jcezar@icmc.usp.br",
        "name": "Prof. Dr. Julio Cezar Estrella",
        "title": "Associate Professor",
        "titlePt": "Professor Associado",
        "area": "Service-Oriented Architectures, Cloud Computing, Distributed Systems",
        "areaPt": "Arquiteturas Orientadas a Serviço, Computação em Nuvem, Sistemas Distribuídos",
        "lattes": "http://lattes.cnpq.br/5433967267727516",
        "orcid": None,
        "scholar": None,
        "page": "https://cemeai.icmc.usp.br/julio-cezar-estrella/",
        "photo": None,
        "bio": (
            "Julio Cezar Estrella is an Associate Professor at ICMC/USP. His research includes "
            "performance evaluation of computational systems, service-oriented architectures, "
            "cloud computing, high-performance processing, computer networks, distributed systems, "
            "and web services."
        ),
        "bioPt": (
            "Julio Cezar Estrella é Professor Associado do ICMC/USP. Suas pesquisas incluem "
            "avaliação de desempenho de sistemas computacionais, arquiteturas orientadas a "
            "serviços, computação em nuvem, processamento de alto desempenho, redes de "
            "computadores, sistemas distribuídos e web services."
        ),
        "research_areas": [
            "Cloud Computing",
            "Distributed Systems",
            "Service-Oriented Architectures",
            "Performance Evaluation",
            "Web Services",
        ],
        "year_joined": 2010,
        "skills": ["Cloud Computing", "Web Services", "SOA", "Performance Evaluation", "Distributed Systems"],
    },
    {
        "email": "sarita@icmc.usp.br",
        "name": "Profa. Dra. Sarita Mazzini Bruschi",
        "title": "Assistant Professor",
        "titlePt": "Professora Doutora",
        "area": "Computer Systems, Operating Systems, Computing Education",
        "areaPt": "Sistemas de Computação, Sistemas Operacionais, Ensino de Computação",
        "lattes": None,
        "orcid": None,
        "scholar": None,
        "page": "https://www.icmc.usp.br/pessoas/sarita",
        "photo": None,
        "bio": (
            "Sarita Mazzini Bruschi is a faculty member in the Computer Systems area at ICMC/USP. "
            "Her academic activities include computer systems, operating systems, technical "
            "education initiatives, and projects connected to software and systems teaching."
        ),
        "bioPt": (
            "Sarita Mazzini Bruschi é docente na área de Sistemas de Computação do ICMC/USP. "
            "Suas atividades acadêmicas incluem sistemas de computação, sistemas operacionais, "
            "iniciativas de ensino técnico e projetos ligados ao ensino de software e sistemas."
        ),
        "research_areas": [
            "Computer Systems",
            "Operating Systems",
            "Computing Education",
            "Software Engineering Education",
        ],
        "year_joined": 2004,
        "skills": ["Operating Systems", "Computer Systems", "Teaching", "Educational Tools"],
    },
]


ENRICHED_STUDENTS = [
    {
        "name": "Lucas Almeida",
        "email": "lucas.almeida@usp.br",
        "level": "PhD",
        "levelPt": "Doutorado",
        "area": "HPC Scheduling",
        "areaPt": "Escalonamento HPC",
        "bio": "PhD student researching scheduling techniques for high-performance computing environments.",
        "bioPt": "Aluno de doutorado pesquisando técnicas de escalonamento para ambientes de computação de alto desempenho.",
        "research_areas": ["High-Performance Computing", "Scheduling", "Performance Evaluation"],
        "year_joined": 2021,
        "skills": ["Python", "MPI", "Simulation", "Linux"],
        "usp_number": "11223344",
        "github": "https://github.com/lasdpc-lucas",
    },
    {
        "name": "Mariana Costa",
        "email": "mariana.costa@usp.br",
        "level": "MSc",
        "levelPt": "Mestrado",
        "area": "Cloud Resource Management",
        "areaPt": "Gerenciamento de Recursos em Nuvem",
        "bio": "MSc student working on resource allocation and observability for cloud platforms.",
        "bioPt": "Aluna de mestrado atuando em alocação de recursos e observabilidade para plataformas em nuvem.",
        "research_areas": ["Cloud Computing", "Resource Management", "Observability"],
        "year_joined": 2022,
        "skills": ["Kubernetes", "Docker", "Prometheus", "Python"],
        "usp_number": "22334455",
        "linkedin": "https://linkedin.com/in/mariana-costa-lasdpc",
    },
    {
        "name": "Felipe Oliveira",
        "email": "felipe.oliveira@usp.br",
        "level": "PhD",
        "levelPt": "Doutorado",
        "area": "AI-driven Systems",
        "areaPt": "Sistemas com IA",
        "bio": "PhD student exploring machine learning techniques for adaptive distributed systems.",
        "bioPt": "Aluno de doutorado investigando técnicas de aprendizado de máquina para sistemas distribuídos adaptativos.",
        "research_areas": ["Artificial Intelligence", "Distributed Systems", "Adaptive Systems"],
        "year_joined": 2020,
        "skills": ["Machine Learning", "PyTorch", "Distributed Systems", "Data Analysis"],
        "usp_number": "33445566",
        "github": "https://github.com/lasdpc-felipe",
    },
    {
        "name": "Ana Beatriz Lima",
        "email": "ana.beatriz.lima@usp.br",
        "level": "MSc",
        "levelPt": "Mestrado",
        "area": "Concurrent Testing",
        "areaPt": "Teste Concorrente",
        "bio": "MSc student focused on testing strategies for concurrent and parallel programs.",
        "bioPt": "Aluna de mestrado focada em estratégias de teste para programas concorrentes e paralelos.",
        "research_areas": ["Concurrent Programming", "Software Testing", "Parallel Programs"],
        "year_joined": 2023,
        "skills": ["Java", "Testing", "Concurrency", "Git"],
        "usp_number": "44556677",
    },
    {
        "name": "Rafael Mendes",
        "email": "rafael.mendes@usp.br",
        "level": "Undergrad",
        "levelPt": "Graduação",
        "area": "Distributed Databases",
        "areaPt": "Bancos de Dados Distribuídos",
        "bio": "Undergraduate researcher studying replication and consistency in distributed databases.",
        "bioPt": "Aluno de graduação pesquisando replicação e consistência em bancos de dados distribuídos.",
        "research_areas": ["Distributed Databases", "Replication", "Consistency"],
        "year_joined": 2024,
        "skills": ["SQL", "MongoDB", "Go", "Docker"],
        "usp_number": "55667788",
    },
    {
        "name": "Carla Ferreira",
        "email": "carla.ferreira@usp.br",
        "level": "Alumni",
        "levelPt": "Egresso",
        "area": "Machine Learning",
        "areaPt": "Aprendizado de Máquina",
        "bio": "LASDPC alumna who worked on machine learning models for performance prediction.",
        "bioPt": "Egressa do LASDPC que atuou em modelos de aprendizado de máquina para predição de desempenho.",
        "research_areas": ["Machine Learning", "Performance Prediction", "Data Science"],
        "year_joined": 2019,
        "graduation_year": 2024,
        "skills": ["Python", "Scikit-learn", "Data Science", "Statistics"],
        "usp_number": "66778899",
        "linkedin": "https://linkedin.com/in/carla-ferreira-lasdpc",
    },
]


def _initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper()


def _load_json(filename: str):
    filepath = DATA_DIR / filename
    if not filepath.exists():
        print(f"[!] File not found: {filepath}")
        return []
    with open(filepath, encoding="utf-8") as f:
        return json.load(f)


def _merge_people_by_email(*groups: list[dict]) -> list[dict]:
    people: dict[str, dict] = {}
    names_to_email: dict[str, str] = {}
    for group in groups:
        for item in group:
            person = dict(item)
            person.pop("id", None)
            name = person["name"]
            name_key = re.sub(r"\s+", " ", name).strip().lower()
            email = person.get("email") or f"{name.split()[0].lower()}@usp.br"
            person["email"] = email
            existing_email = names_to_email.get(name_key)
            if existing_email and existing_email != email:
                people[email] = {**people.pop(existing_email), **person}
            else:
                people[email] = {**people.get(email, {}), **person}
            names_to_email[name_key] = email
    return list(people.values())


async def _upsert_user(db, doc: dict) -> str:
    email = doc["email"]
    result = await db.users.update_one(
        {"email": email},
        {
            "$set": doc,
            "$setOnInsert": {
                "hashed_password": hash_password(DEFAULT_PASSWORD),
                "is_admin": False,
                "avatar": None,
                "status": "active",
            },
        },
        upsert=True,
    )
    if result.upserted_id:
        return "inserted"
    if result.modified_count:
        return "updated"
    return "unchanged"


async def _cleanup_legacy_student_email(db, name: str, canonical_email: str) -> None:
    legacy_email = f"{name.split()[0].lower()}@usp.br"
    if legacy_email == canonical_email:
        return
    legacy = await db.users.find_one({"email": legacy_email, "role": {"$in": ["aluno_ativo", "alumni"]}})
    if not legacy:
        return
    canonical = await db.users.find_one({"email": canonical_email})
    if canonical:
        await db.users.delete_one({"_id": legacy["_id"], "is_admin": {"$ne": True}})
        print(f"[-] Removed legacy seed duplicate {legacy_email}")
        return
    await db.users.update_one({"_id": legacy["_id"]}, {"$set": {"email": canonical_email}})
    print(f"[~] Renamed legacy seed email {legacy_email} -> {canonical_email}")


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
        count = await db[collection_name].count_documents({})
        if count > 0:
            print(f"[=] {collection_name} already has {count} documents, skipping")
            continue

        data = _load_json(filename)

        for doc in data:
            doc.pop("id", None)

        if data:
            await db[collection_name].insert_many(data)
            print(f"[+] Inserted {len(data)} documents into {collection_name}")

    # --- Seed infrastructure (clusters) ---
    infra_file = DATA_DIR / "MOCKED_INFRASTRUCTURE.json"
    if infra_file.exists():
        count = await db.clusters.count_documents({})
        if count > 0:
            print(f"[=] clusters already has {count} documents, skipping")
        else:
            with open(infra_file, encoding="utf-8") as f:
                infra_data = json.load(f)
            clusters = infra_data.get("clusters", [])
            for c in clusters:
                c.pop("id", None)
            if clusters:
                await db.clusters.insert_many(clusters)
                print(f"[+] Inserted {len(clusters)} documents into clusters")

    # --- Seed people (docentes + students) into users collection ---
    docentes = _merge_people_by_email(_load_json("MOCKED_DOCENTES.json"), ENRICHED_DOCENTES)
    students = _merge_people_by_email(_load_json("MOCKED_STUDENTS.json"), ENRICHED_STUDENTS)

    user_stats = {"inserted": 0, "updated": 0, "unchanged": 0}

    for d in docentes:
        doc = {
            "name": d["name"],
            "role": "docente",
            "initials": _initials(d["name"]),
            "title": d.get("title") or d.get("role"),
            "titlePt": d.get("titlePt") or d.get("rolePt"),
            "area": d.get("area"),
            "areaPt": d.get("areaPt"),
            "lattes": d.get("lattes"),
            "orcid": d.get("orcid"),
            "scholar": d.get("scholar"),
            "page": d.get("page"),
            "photo": d.get("photo"),
            "research_areas": d.get("research_areas"),
            "year_joined": d.get("year_joined"),
            "bio": d.get("bio"),
            "bioPt": d.get("bioPt"),
            "skills": d.get("skills"),
            "linkedin": d.get("linkedin"),
            "github": d.get("github"),
            "twitter": d.get("twitter"),
            "researchgate": d.get("researchgate"),
            "usp_number": d.get("usp_number"),
        }
        doc["email"] = d["email"]
        status = await _upsert_user(db, doc)
        user_stats[status] += 1

    for s in students:
        name = s["name"]
        level = s.get("level", "")
        role = "alumni" if level.lower() == "alumni" else "aluno_ativo"
        await _cleanup_legacy_student_email(db, name, s["email"])
        doc = {
            "email": s["email"],
            "name": name,
            "role": role,
            "initials": _initials(name),
            "area": s.get("area"),
            "areaPt": s.get("areaPt"),
            "level": s.get("level"),
            "levelPt": s.get("levelPt"),
            "research_areas": s.get("research_areas"),
            "year_joined": s.get("year_joined"),
            "bio": s.get("bio"),
            "bioPt": s.get("bioPt"),
            "skills": s.get("skills"),
            "graduation_year": s.get("graduation_year"),
            "linkedin": s.get("linkedin"),
            "github": s.get("github"),
            "twitter": s.get("twitter"),
            "researchgate": s.get("researchgate"),
            "usp_number": s.get("usp_number"),
        }
        status = await _upsert_user(db, doc)
        user_stats[status] += 1

    print(
        "[+] Users seed complete: "
        f"{user_stats['inserted']} inserted, "
        f"{user_stats['updated']} updated, "
        f"{user_stats['unchanged']} unchanged"
    )

    print("\nSeed complete!")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
