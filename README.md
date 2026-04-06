# LASDPC Website

Full-stack web application: React frontend + FastAPI backend + MongoDB.

## Prerequisites

- **Node.js** >= 18
- **Python** 3.9+
- **Docker** (for MongoDB)

## Quick Start

### 1. Start MongoDB

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install email-validator bcrypt==4.0.1
```

Create a `.env` file in `backend/`:

```
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=lasdpc
JWT_SECRET=your-secret-key
```

Seed the database with sample content data:

```bash
python -m scripts.seed
```

Run the server:

```bash
uvicorn main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

### 3. Create the Admin User

Add `ADMIN_BOOTSTRAP_TOKEN` to your `backend/.env`:

```
ADMIN_BOOTSTRAP_TOKEN=some-long-random-secret
```

Then call the bootstrap route once to create the first admin:

```bash
curl -X POST http://localhost:8000/api/v1/users/bootstrap \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: some-long-random-secret" \
  -d '{"email":"admin@lasdpc.usp.br","password":"your-secure-password","name":"Admin LASDPC"}'
```

After the admin is created, remove `ADMIN_BOOTSTRAP_TOKEN` from `.env` (or set it to empty) and restart the server to disable the route.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at http://localhost:8080
