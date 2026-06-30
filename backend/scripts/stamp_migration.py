"""
stamp_migration.py
------------------
Usado por el workflow de CI/CD. Se ejecuta dentro del contenedor backend
para registrar la revisión de Alembic 'e88cd9c1e280' cuando la tabla
ya existe en producción pero la revisión aún no está estampada.

Ejecución:
    docker compose exec -T backend python scripts/stamp_migration.py
"""
import os
import sys

from sqlalchemy import create_engine, inspect, text

REVISION = "e88cd9c1e280"
MARKER_TABLE = "rendimiento_tecnico_recomendaciones"

db_url = os.environ.get("DATABASE_URL", "")
if not db_url:
    print("No DATABASE_URL found, skipping stamp check.")
    sys.exit(0)

engine = create_engine(db_url)
with engine.connect() as conn:
    tables = inspect(engine).get_table_names()

    try:
        row = conn.execute(
            text("SELECT version_num FROM alembic_version WHERE version_num = :rev"),
            {"rev": REVISION},
        ).fetchone()
    except Exception:
        # La tabla alembic_version aún no existe; las migraciones la crearán.
        row = None

    if MARKER_TABLE in tables and row is None:
        conn.execute(
            text("INSERT INTO alembic_version (version_num) VALUES (:rev)"),
            {"rev": REVISION},
        )
        conn.commit()
        print(f"✅ Stamped {REVISION} — tabla '{MARKER_TABLE}' existía, revisión registrada.")
    else:
        print("✔ Sin acción: tabla no existe aún, o revisión ya estaba registrada.")
