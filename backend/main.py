import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings
from core.database import get_db
from core.security import hash_password
from routers import auth, users, projects, publications, blog, people, infrastructure, docs, stats, uploads, cluster_requests, notifications

logger = logging.getLogger(__name__)

app = FastAPI(title="LASDPC API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(publications.router, prefix="/api/v1/publications", tags=["publications"])
app.include_router(blog.router, prefix="/api/v1/blog", tags=["blog"])
app.include_router(people.router, prefix="/api/v1/people", tags=["people"])
app.include_router(infrastructure.router, prefix="/api/v1/infrastructure", tags=["infrastructure"])
app.include_router(docs.router, prefix="/api/v1/docs", tags=["docs"])
app.include_router(stats.router, prefix="/api/v1/stats", tags=["stats"])
app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["uploads"])
app.include_router(cluster_requests.router, prefix="/api/v1/cluster-requests", tags=["cluster-requests"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.on_event("startup")
async def auto_bootstrap_admin():
    if not settings.admin_email or not settings.admin_password:
        return
    db = get_db()
    existing = await db.users.find_one({"email": settings.admin_email, "is_admin": True})
    if existing:
        logger.info("Admin user already exists, skipping bootstrap")
        return
    names = settings.admin_name.strip().split()
    initials = (names[0][0] + names[-1][0]).upper() if len(names) >= 2 else settings.admin_name[:2].upper()
    await db.users.insert_one({
        "email": settings.admin_email,
        "hashed_password": hash_password(settings.admin_password),
        "name": settings.admin_name,
        "role": "docente",
        "is_admin": True,
        "avatar": None,
        "initials": initials,
        "status": "active",
    })
    logger.info("Admin user created: %s", settings.admin_email)


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
