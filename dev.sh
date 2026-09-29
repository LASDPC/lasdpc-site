#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_ENV="$BACKEND_DIR/.env"
FRONTEND_ENV="$FRONTEND_DIR/.env"
VENV_DIR="$BACKEND_DIR/venv"
LOG_DIR="$ROOT_DIR/logs"
BACKEND_PID=""
FRONTEND_PID=""
GENERATED_ADMIN_PASSWORD=""

info() { printf '\033[1;34m[LASDPC]\033[0m %s\n' "$*"; }
ok() { printf '\033[1;32m[OK]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[ERRO]\033[0m %s\n' "$*" >&2; exit 1; }

has() { command -v "$1" >/dev/null 2>&1; }

random_hex() {
  if has openssl; then
    openssl rand -hex "$1"
  else
    python3 -c "import secrets; print(secrets.token_hex($1))"
  fi
}

set_env_value() {
  local file="$1" key="$2" value="$3"
  if grep -q "^${key}=" "$file"; then
    sed -i.bak "s|^${key}=.*|${key}=${value}|" "$file"
    rm -f "$file.bak"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$file"
  fi
}

configure_env() {
  if [[ ! -f "$BACKEND_ENV" ]]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_ENV"
    ok "backend/.env criado."
  else
    ok "backend/.env já existe; valores personalizados serão preservados."
  fi

  # Troca somente valores de exemplo/inseguros. Valores personalizados são preservados.
  local current_value
  current_value="$(sed -n 's/^JWT_SECRET=//p' "$BACKEND_ENV" | tail -n 1)"
  if [[ -z "$current_value" || "$current_value" == "change-this-to-a-long-random-string" ]]; then
    set_env_value "$BACKEND_ENV" JWT_SECRET "$(random_hex 32)"
  fi
  current_value="$(sed -n 's/^MINIO_ROOT_PASSWORD=//p' "$BACKEND_ENV" | tail -n 1)"
  if [[ -z "$current_value" || "$current_value" == "change_me_to_a_strong_password" ]]; then
    set_env_value "$BACKEND_ENV" MINIO_ROOT_PASSWORD "$(random_hex 24)"
  fi
  current_value="$(sed -n 's/^ADMIN_PASSWORD=//p' "$BACKEND_ENV" | tail -n 1)"
  if [[ -z "$current_value" || "$current_value" == "suaSenhaSegura" ]]; then
    GENERATED_ADMIN_PASSWORD="$(random_hex 12)"
    set_env_value "$BACKEND_ENV" ADMIN_PASSWORD "$GENERATED_ADMIN_PASSWORD"
    info "Credencial criada: admin@lasdpc.usp.br / $GENERATED_ADMIN_PASSWORD"
  fi

  if [[ ! -f "$FRONTEND_ENV" ]]; then
    cp "$FRONTEND_DIR/.env.example" "$FRONTEND_ENV"
    ok "frontend/.env criado."
  else
    ok "frontend/.env já existe; nenhuma configuração foi sobrescrita."
  fi
}

start_docker() {
  has docker || fail "Docker não está instalado. Instale Docker Engine/Desktop e execute novamente."
  docker compose version >/dev/null 2>&1 || fail "O plugin Docker Compose não está instalado."

  if docker info >/dev/null 2>&1; then
    ok "Docker já está rodando."
    return
  fi

  info "Docker não está ativo; tentando iniciá-lo..."
  case "$(uname -s)" in
    Linux)
      if systemctl --user list-unit-files docker-desktop.service >/dev/null 2>&1; then
        systemctl --user start docker-desktop
      elif has systemctl && systemctl list-unit-files docker.service >/dev/null 2>&1; then
        has sudo || fail "É necessário iniciar o Docker: sudo systemctl start docker"
        sudo systemctl start docker
      else
        fail "Não encontrei um serviço Docker. Abra o Docker Desktop e execute novamente."
      fi
      ;;
    Darwin)
      open -a Docker
      ;;
    *) fail "Inicie o Docker Desktop e execute este script novamente." ;;
  esac

  for _ in {1..60}; do
    docker info >/dev/null 2>&1 && { ok "Docker iniciado."; return; }
    sleep 2
  done
  fail "O Docker não ficou disponível dentro de 2 minutos."
}

install_dependencies() {
  has python3 || fail "Python 3 não está instalado."
  has npm || fail "Node.js/npm não está instalado."
  has curl || fail "curl não está instalado."

  if [[ ! -x "$VENV_DIR/bin/python" ]]; then
    info "Criando ambiente virtual Python..."
    python3 -m venv "$VENV_DIR"
  fi
  info "Conferindo dependências do backend..."
  "$VENV_DIR/bin/python" -m pip install -q -r "$BACKEND_DIR/requirements.txt"

  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    info "Instalando dependências do frontend..."
    (cd "$FRONTEND_DIR" && npm ci)
  else
    ok "Dependências do frontend já instaladas."
  fi
}

start_infrastructure() {
  info "Subindo MongoDB e MinIO..."
  (cd "$ROOT_DIR" && docker compose up -d)

  info "Aguardando o MongoDB..."
  for _ in {1..45}; do
    if (cd "$ROOT_DIR" && docker compose exec -T mongo mongosh --quiet --eval \
      'quit(db.adminCommand({ping: 1}).ok ? 0 : 1)' >/dev/null 2>&1); then
      ok "MongoDB disponível."
      return
    fi
    sleep 2
  done
  fail "MongoDB não respondeu. Consulte: docker compose logs mongo"
}

stop_apps() {
  trap - INT TERM EXIT
  info "Encerrando backend e frontend..."
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  [[ -n "$BACKEND_PID" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  info "MongoDB e MinIO continuam ativos. Para pará-los: docker compose down"
}

start_apps() {
  mkdir -p "$LOG_DIR"
  trap stop_apps INT TERM EXIT

  info "Iniciando backend..."
  (cd "$BACKEND_DIR" && exec "$VENV_DIR/bin/uvicorn" main:app --reload --port 8000) \
    >"$LOG_DIR/backend.log" 2>&1 &
  BACKEND_PID=$!

  for _ in {1..30}; do
    if curl -fsS http://127.0.0.1:8000/api/v1/health >/dev/null 2>&1; then
      ok "Backend disponível em http://localhost:8000/docs"
      break
    fi
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      tail -n 40 "$LOG_DIR/backend.log" >&2 || true
      fail "O backend encerrou durante a inicialização."
    fi
    sleep 1
  done
  curl -fsS http://127.0.0.1:8000/api/v1/health >/dev/null 2>&1 || \
    fail "O backend não respondeu. Veja logs/backend.log"

  info "Iniciando frontend..."
  (cd "$FRONTEND_DIR" && exec npm run dev) >"$LOG_DIR/frontend.log" 2>&1 &
  FRONTEND_PID=$!

  for _ in {1..30}; do
    curl -fsS http://127.0.0.1:8080 >/dev/null 2>&1 && break
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      tail -n 40 "$LOG_DIR/frontend.log" >&2 || true
      fail "O frontend encerrou durante a inicialização."
    fi
    sleep 1
  done
  curl -fsS http://127.0.0.1:8080 >/dev/null 2>&1 || \
    fail "O frontend não respondeu. Veja logs/frontend.log"

  printf '\n\033[1;32mSite pronto:\033[0m http://localhost:8080\n'
  printf 'API/docs:     http://localhost:8000/docs\n'
  printf 'MinIO:        http://localhost:9001\n'
  printf 'Logs:         %s\n' "$LOG_DIR"
  if [[ -n "$GENERATED_ADMIN_PASSWORD" ]]; then
    printf '\nAdmin:        admin@lasdpc.usp.br\n'
    printf 'Senha gerada: %s\n' "$GENERATED_ADMIN_PASSWORD"
  fi
  printf '\nPressione Ctrl+C para encerrar backend e frontend.\n\n'

  wait "$BACKEND_PID" "$FRONTEND_PID"
}

main() {
  cd "$ROOT_DIR"
  configure_env
  start_docker
  install_dependencies
  start_infrastructure
  start_apps
}

main "$@"
