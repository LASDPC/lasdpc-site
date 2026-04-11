# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LASDPC website — a bilingual (pt-BR / en-US) academic lab site with a React+TypeScript frontend and a Python FastAPI backend backed by MongoDB.

## Development Commands

### Infrastructure
```bash
docker compose up -d          # Start MongoDB (port 27017)
```

### Backend (from `backend/`)
```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000   # API at localhost:8000, docs at /docs
python -m scripts.seed                   # Seed DB with sample data
```

Backend env vars go in `backend/.env` (see `core/config.py` for all fields):
`MONGO_URI`, `MONGO_DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGINS`

### Frontend (from `frontend/`)
```bash
npm install
npm run dev           # Dev server at localhost:8080 (proxies /api to backend)
npm run build         # Production build
npm run lint          # ESLint
npm run test          # Vitest (single run)
npm run test:watch    # Vitest (watch mode)
```

Frontend env vars: `VITE_API_URL` (defaults to `http://localhost:8000`), `VITE_MAINTENANCE_MODE`

## Architecture

### Backend (`backend/`)
- **FastAPI** app in `main.py`, all routes under `/api/v1/`
- **Motor** (async MongoDB driver) via `core/database.py` — no ORM, direct collection access
- `core/config.py` — Pydantic Settings loaded from `.env`
- `core/security.py` / `core/dependencies.py` — JWT auth, password hashing, route guards
- `routers/` — one file per resource (blog, projects, publications, people, infrastructure, docs, stats, auth, users)
- `models/` — Pydantic schemas for each resource
- Admin bootstrap: auto-creates admin user on startup if `ADMIN_EMAIL`/`ADMIN_PASSWORD` are set

### Frontend (`frontend/`)
- **Vite + React 18 + TypeScript**, ShadCN/UI components (Radix + Tailwind CSS)
- `src/services/` — thin API clients per resource, all use `src/lib/api.ts` (fetch wrapper with JWT token from localStorage)
- `src/hooks/` — React Query hooks wrapping each service
- `src/contexts/` — AuthContext (JWT login state), LanguageContext (i18n via JSON files in `src/data/i18n/`), ThemeContext
- `src/pages/` — route pages; `AdminEditPage` is the generic CRUD editor for all resources
- Path alias: `@` maps to `src/`
- Vite dev server proxies `/api` requests to the backend at port 8000

### Content Model
All resources are bilingual with paired fields (e.g., `title`/`titlePt`, `description`/`descriptionPt`, `content`/`contentPt`). English is the base field name; Portuguese uses the `Pt` suffix.

### Maintenance Mode
Set `VITE_MAINTENANCE_MODE=true` to show a coming-soon page to non-admin visitors. Admins can still access all routes after logging in at `/login`.
