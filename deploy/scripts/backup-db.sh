#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

mkdir -p .backups
timestamp="$(date +%Y%m%d_%H%M%S)"
destination=".backups/torre_control_${timestamp}.dump"

docker compose exec -T db sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner' \
  > "$destination"

test -s "$destination"
echo "Respaldo creado: $destination"
