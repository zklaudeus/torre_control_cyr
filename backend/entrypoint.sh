#!/bin/bash
set -e

echo "▶ Limpiando tabla alembic_version si tiene conflictos (overlap)..."
python -c "
from sqlalchemy import create_engine, text
import os
url = os.environ.get('DATABASE_URL','')
if url:
    try:
        eng = create_engine(url)
        with eng.connect() as c:
            rows = c.execute(text('SELECT version_num FROM alembic_version')).fetchall()
            if len(rows) > 1:
                print('  Se encontraron múltiples versiones:', [r[0] for r in rows])
                c.execute(text('DELETE FROM alembic_version'))
                # Como f6a1b2c3d4e5 es el head real y e88cd9c1e280 su padre, dejamos el head.
                c.execute(text('INSERT INTO alembic_version (version_num) VALUES (:v)'), {'v': 'f6a1b2c3d4e5'})
                c.commit()
                print('  Conflicto resuelto: se forzó la versión f6a1b2c3d4e5')
            else:
                print('  No hay conflictos en alembic_version')
    except Exception as e:
        print('  No se pudo limpiar alembic_version:', e)
"

echo "▶ Ejecutando migraciones Alembic..."
alembic upgrade head
echo "✓ Migraciones aplicadas correctamente"

echo "▶ Iniciando servidor Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
