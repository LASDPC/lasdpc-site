from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers import auth, users, projects, publications, blog, people, infrastructure, docs

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


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
