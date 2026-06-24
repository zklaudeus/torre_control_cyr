"""Verifica en modo solo lectura el esquema creado por la migración 012."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings


MIGRATION_FILE = BACKEND_ROOT / "sql" / "012_rendimiento_tecnico.sql"
MIGRATION_SQL = MIGRATION_FILE.read_text(encoding="utf-8")

EXPECTED_TABLES = set(
    re.findall(r"(?im)^CREATE TABLE\s+([a-z0-9_]+)", MIGRATION_SQL)
)
EXPECTED_INDEXES = set(
    re.findall(
        r"(?im)^CREATE\s+(?:UNIQUE\s+)?INDEX\s+([a-z0-9_]+)",
        MIGRATION_SQL,
    )
)
EXPECTED_CONSTRAINTS = set(
    re.findall(r"(?im)\bCONSTRAINT\s+([a-z0-9_]+)", MIGRATION_SQL)
)


def collect_postflight(cursor: Any) -> dict[str, object]:
    cursor.execute(
        """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = ANY(%s)
        ORDER BY table_name
        """,
        (sorted(EXPECTED_TABLES),),
    )
    actual_tables = {row[0] for row in cursor.fetchall()}

    cursor.execute(
        """
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = current_schema()
          AND table_name = ANY(%s)
        """,
        (sorted(EXPECTED_TABLES),),
    )
    actual_constraints = {row[0] for row in cursor.fetchall()}

    cursor.execute(
        """
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = current_schema()
        """
    )
    actual_indexes = {row[0] for row in cursor.fetchall()}

    cursor.execute(
        """
        SELECT numeric_precision, numeric_scale
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'rendimiento_tecnico_diario'
          AND column_name = 'cumplimiento_pct'
        """
    )
    numeric_shape = cursor.fetchone()

    cursor.execute(
        """
        SELECT count(*)
        FROM (
            SELECT codigo_sap
            FROM control_supervisor_usuarios_sap
            WHERE activo IS TRUE
            GROUP BY codigo_sap
            HAVING count(*) > 1
        ) AS duplicates
        """
    )
    duplicate_active_sap_count = cursor.fetchone()[0]

    cursor.execute(
        """
        SELECT 'bitacoras_supervisor_diarias', count(*) FROM bitacoras_supervisor_diarias
        UNION ALL
        SELECT 'rendimiento_tecnico_ausencias', count(*) FROM rendimiento_tecnico_ausencias
        UNION ALL
        SELECT 'rendimiento_tecnico_diario', count(*) FROM rendimiento_tecnico_diario
        UNION ALL
        SELECT 'rendimiento_tecnico_actual', count(*) FROM rendimiento_tecnico_actual
        UNION ALL
        SELECT 'rendimiento_tecnico_historial', count(*) FROM rendimiento_tecnico_historial
        UNION ALL
        SELECT 'rendimiento_tecnico_advertencias', count(*) FROM rendimiento_tecnico_advertencias
        UNION ALL
        SELECT 'rendimiento_tecnico_causas_fallidas', count(*) FROM rendimiento_tecnico_causas_fallidas
        ORDER BY 1
        """
    )
    table_row_counts = dict(cursor.fetchall())

    missing_tables = sorted(EXPECTED_TABLES - actual_tables)
    missing_indexes = sorted(EXPECTED_INDEXES - actual_indexes)
    missing_constraints = sorted(EXPECTED_CONSTRAINTS - actual_constraints)

    checks = {
        "all_tables_present": not missing_tables,
        "all_indexes_present": not missing_indexes,
        "all_constraints_present": not missing_constraints,
        "numeric_7_2": numeric_shape == (7, 2),
        "active_sap_unique": duplicate_active_sap_count == 0,
    }

    return {
        "status": "PASS" if all(checks.values()) else "FAIL",
        "checks": checks,
        "expected_table_count": len(EXPECTED_TABLES),
        "expected_index_count": len(EXPECTED_INDEXES),
        "expected_named_constraint_count": len(EXPECTED_CONSTRAINTS),
        "missing_tables": missing_tables,
        "missing_indexes": missing_indexes,
        "missing_constraints": missing_constraints,
        "cumplimiento_pct_shape": numeric_shape,
        "duplicate_active_sap_count": duplicate_active_sap_count,
        "table_row_counts": table_row_counts,
    }


def run_postflight() -> dict[str, object]:
    if not settings.DATABASE_URL:
        raise RuntimeError("DATABASE_URL no está configurada")

    engine = create_engine(settings.DATABASE_URL)
    connection = engine.raw_connection()
    connection.set_session(readonly=True, autocommit=False)

    try:
        with connection.cursor() as cursor:
            return collect_postflight(cursor)
    finally:
        connection.rollback()
        connection.close()
        engine.dispose()


if __name__ == "__main__":
    try:
        result = run_postflight()
    except Exception as exc:
        print(json.dumps({"status": "ERROR", "error": str(exc)}, ensure_ascii=False))
        raise SystemExit(2) from exc

    print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
    raise SystemExit(0 if result["status"] == "PASS" else 1)
