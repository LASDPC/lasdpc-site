# LASDPC Website

Full-stack web application: React frontend + FastAPI backend + MongoDB + MinIO (S3-compatible) for media storage.

## Prerequisites

- **Node.js** >= 18
- **Python** 3.9+
- **Docker** + Docker Compose (for MongoDB and MinIO)

Make sure the Docker daemon is running before any `docker compose` command:

```bash
# Linux com Docker Desktop:
systemctl --user start docker-desktop
# Linux com Docker Engine nativo:
sudo systemctl start docker
# macOS / Windows: abra o Docker Desktop manualmente
docker info >/dev/null && echo "docker ok"
```

## Quick Start

### 1. Configure environment

The docker-compose stack reads variables from `backend/.env`, so there's a single config file for both the backend app and the MinIO containers. Copy the template and set a strong MinIO password:

```bash
cd backend
cp .env.example .env
# Generate a strong password:
openssl rand -base64 32
# Paste the output into MINIO_ROOT_PASSWORD inside backend/.env
cd ..
```

### 2. Start infrastructure (MongoDB + MinIO)

```bash
docker compose up -d
```

This brings up:
- **MongoDB** on `localhost:27018` (mapped to container's `27017` to avoid clashing with any native mongod on the host)
- **MinIO S3 API** on `localhost:9000` (bound to loopback)
- **MinIO Console** on `localhost:9001` (login with `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` from `backend/.env`)

A one-shot `minio-init` container auto-creates the bucket (`lasdpc-media` by default) with anonymous read. Verify:

```bash
docker logs lasdpc-minio-init
# expected last line: "MinIO bucket provisioned: lasdpc-media"

docker compose ps
# all 3 services should be Up (minio-init exits with status 0 after provisioning)
```

### 3. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m scripts.seed                       # seeds sample content + users
uvicorn main:app --reload --port 8000        # API at localhost:8000, docs at /docs
```

Quick smoke test in another terminal:

```bash
curl http://localhost:8000/api/v1/health     # {"status":"ok"}
```

### 4. Create the Admin User

Add `ADMIN_BOOTSTRAP_TOKEN` to `backend/.env`:

```
ADMIN_BOOTSTRAP_TOKEN=some-long-random-secret
```

Restart uvicorn, then:

```bash
curl -X POST http://localhost:8000/api/v1/users/bootstrap \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: some-long-random-secret" \
  -d '{"email":"admin@lasdpc.usp.br","password":"your-secure-password","name":"Admin LASDPC"}'
```

After the admin exists, remove `ADMIN_BOOTSTRAP_TOKEN` (or empty it) and restart the server to disable the route.

### 5. Frontend

```bash
cd frontend
cp .env.example .env       # default VITE_MINIO_PUBLIC_URL=http://localhost:9000/lasdpc-media works for dev
npm install
npm run dev                # app at localhost:8080
```

## Verify the MinIO Pipeline End-to-End

After everything is up, you can confirm uploads work without opening the browser:

```bash
# Upload (anonymous endpoint used during registration)
curl -X POST -F "file=@/path/to/some.jpg" http://localhost:8000/api/v1/uploads/public
# → {"key":"profile/abc...jpg"}

# Download the same object straight from MinIO (public read)
curl -O http://localhost:9000/lasdpc-media/profile/abc...jpg
```

## Media Storage Notes

- Images are stored in MinIO under prefixes: `profile/`, `blog/`, `markdown/`.
- The database stores **only the object key** (e.g. `blog/abc.jpg`). The frontend builds the public URL via `VITE_MINIO_PUBLIC_URL + key`.
- In production, expose MinIO via a reverse proxy on a dedicated subdomain (e.g. `cdn.lasdpc.usp.br`) and set `VITE_MINIO_PUBLIC_URL` and `MINIO_PUBLIC_URL` accordingly. Restrict `MINIO_API_CORS_ALLOW_ORIGIN` to your frontend domain.
- To migrate legacy Base64 / filesystem images to MinIO, see `backend/scripts/migrate_images.py` (run with `--dry-run` first).

## Troubleshooting

**`docker compose up -d` warns `MINIO_ROOT_PASSWORD variable is not set`**
You skipped step 1. The compose file reads from `backend/.env`. Run `cp backend/.env.example backend/.env` first.

**`Cannot connect to the Docker daemon`**
The Docker daemon isn't running. See the Prerequisites section.

**`ports are not available: ... bind: address already in use` on 27017**
You have a native `mongod` running on the host. The compose file already maps the container Mongo to `27018` on the host to avoid this - make sure `MONGO_URI` in `backend/.env` ends with `:27018`.

**`unpigz: corrupted -- crc32 mismatch` during `docker compose pull`**
Transient registry/network glitch. Retry: `docker compose pull && docker compose up -d`.
