"""Aplica la migración 012 con preflight, validación previa al commit y postflight."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy import create_engine

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings
from scripts.run_postflight_012 import collect_postflight, run_postflight
from scripts.run_preflight_012 import run_preflight


MIGRATION_FILE = BACKEND_ROOT / "sql" / "012_rendimiento_tecnico.sql"


def run_migration() -> dict[str, object]:
    preflight = run_preflight()
    if preflight["status"] != "PASS":
        raise RuntimeError("El preflight 012 no está aprobado")

    sql = MIGRATION_FILE.read_text(encoding="utf-8")
    if not sql.rstrip().endswith("COMMIT;"):
        raise RuntimeError("La migración 012 no termina en COMMIT explícito")

    # El commit final se controla aquí para inspeccionar el esquema antes de
    # hacerlo permanente.
    sql_without_commit = sql.rstrip()[: -len("COMMIT;")]

    engine = create_engine(settings.DATABASE_URL)
    connection = engine.raw_connection()
    connection.set_session(readonly=False, autocommit=False)

    try:
        with connection.cursor() as cursor:
            cursor.execute(sql_without_commit)
            precommit_validation = collect_postflight(cursor)

        if precommit_validation["status"] != "PASS":
            raise RuntimeError(
                "La validación previa al commit falló: "
                + json.dumps(precommit_validation, ensure_ascii=False, default=str)
            )

        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
        engine.dispose()

    postflight = run_postflight()
    if postflight["status"] != "PASS":
        raise RuntimeError(
            "La migración fue confirmada, pero el postflight falló: "
            + json.dumps(postflight, ensure_ascii=False, default=str)
        )

    return {
        "status": "PASS",
        "preflight": preflight["checks"],
        "precommit_validation": precommit_validation["checks"],
        "postflight": postflight,
        "transaction": "committed",
    }


if __name__ == "__main__":
    try:
        result = run_migration()
    except Exception as exc:
        print(json.dumps({"status": "ERROR", "error": str(exc)}, ensure_ascii=False))
        raise SystemExit(2) from exc

    print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
