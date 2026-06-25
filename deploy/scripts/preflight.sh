#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

for command in docker git nginx; do
  command -v "$command" >/dev/null || {
    echo "Falta el comando requerido: $command"
    exit 1
  }
done

docker compose version >/dev/null
test -f .env || {
  echo "Falta .env. Copia .env.production.example y completa sus valores."
  exit 1
}

if grep -Eq 'CAMBIA_ESTO|TU_IP_O_DOMINIO_AQUI' .env; then
  echo "El archivo .env todavía contiene valores de ejemplo."
  exit 1
fi

docker compose config --quiet
echo "Preflight de producción: OK"
