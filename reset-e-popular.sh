#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PYTHON="$ROOT_DIR/backend/venv/bin/python"

if [[ ! -x "$PYTHON" ]]; then
  echo "Ambiente Python ausente. Crie backend/venv e instale backend/requirements.txt primeiro." >&2
  exit 1
fi
if [[ ! -f "$ROOT_DIR/backend/.env" ]]; then
  echo "backend/.env ausente. Configure MongoDB, MinIO e administrador primeiro." >&2
  exit 1
fi

cd "$ROOT_DIR/backend"
exec "$PYTHON" -m scripts.reset_and_populate "$@"
