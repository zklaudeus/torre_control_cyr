#!/bin/bash
set -e

echo "▶ Limpiando alembic_version duplicada (hotfix previo)..."
python -c "
from sqlalchemy import create_engine, text
import os
url = os.environ.get('DATABASE_URL','')
if url:
    eng = create_engine(url)
    with eng.connect() as c:
        rows = c.execute(text('SELECT version_num FROM alembic_version')).fetchall()
        if len(rows) > 1:
            # Keep only the latest revision
            latest = max(r[0] for r in rows)
            c.execute(text('DELETE FROM alembic_version'))
            c.execute(text('INSERT INTO alembic_version (version_num) VALUES (:v)'), {'v': latest})
            c.commit()
            print(f'  Cleaned: kept {latest}, removed {len(rows)-1} duplicates')
        else:
            print('  No duplicates found')
" || echo "  (skip cleanup)"

echo "▶ Ejecutando stamp manual por seguridad (si aplica)..."
python scripts/stamp_migration.py || echo "  (skip stamp)"

echo "▶ Ejecutando migraciones Alembic..."
alembic upgrade head
echo "✓ Migraciones aplicadas correctamente"

echo "▶ Iniciando servidor Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
