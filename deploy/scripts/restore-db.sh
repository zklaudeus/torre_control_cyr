#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 2 || "$2" != "--force" ]]; then
  echo "Uso: $0 RUTA_RESPALDO.dump --force"
  echo "ADVERTENCIA: reemplaza el contenido actual de la base de datos."
  exit 1
fi

DUMP_FILE="$(realpath "$1")"
test -s "$DUMP_FILE"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

docker compose up -d db
until docker compose exec -T db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; do
  sleep 2
done

docker compose exec -T db sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges' \
  < "$DUMP_FILE"

echo "Base de datos restaurada desde: $DUMP_FILE"
