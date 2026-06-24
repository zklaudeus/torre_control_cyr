"""Ejecuta el preflight DBA de la migración 012 sin modificar la base de datos."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy import create_engine

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings


REQUIRED_TABLES = (
    "control_supervisores",
    "control_supervisor_usuarios_sap",
    "control_usuarios",
)

MIGRATION_TABLES = (
    "bitacoras_supervisor_diarias",
    "rendimiento_tecnico_ausencias",
    "rendimiento_tecnico_diario",
    "rendimiento_tecnico_actual",
    "rendimiento_tecnico_historial",
    "rendimiento_tecnico_advertencias",
    "rendimiento_tecnico_causas_fallidas",
)


def run_preflight() -> dict[str, object]:
    if not settings.DATABASE_URL:
        raise RuntimeError("DATABASE_URL no está configurada")

    engine = create_engine(settings.DATABASE_URL)
    connection = engine.raw_connection()
    connection.set_session(readonly=True, autocommit=False)

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    to_regclass('control_supervisores'),
                    to_regclass('control_supervisor_usuarios_sap'),
                    to_regclass('control_usuarios')
                """
            )
            dependencies = cursor.fetchone()

            cursor.execute(
                """
                SELECT table_name, data_type
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND column_name = 'id'
                  AND table_name IN (
                      'control_supervisores',
                      'control_supervisor_usuarios_sap',
                      'control_usuarios'
                  )
                ORDER BY table_name
                """
            )
            id_types = dict(cursor.fetchall())

            cursor.execute(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = current_schema()
                  AND table_name IN (
                      'bitacoras_supervisor_diarias',
                      'rendimiento_tecnico_ausencias',
                      'rendimiento_tecnico_diario',
                      'rendimiento_tecnico_actual',
                      'rendimiento_tecnico_historial',
                      'rendimiento_tecnico_advertencias',
                      'rendimiento_tecnico_causas_fallidas'
                  )
                ORDER BY table_name
                """
            )
            existing_migration_tables = [row[0] for row in cursor.fetchall()]

            cursor.execute(
                """
                SELECT count(*)
                FROM control_supervisor_usuarios_sap
                WHERE activo IS TRUE
                  AND (codigo_sap IS NULL OR btrim(codigo_sap) = '')
                """
            )
            blank_active_sap_count = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT
                    codigo_sap,
                    count(*) AS asignaciones_activas,
                    array_agg(supervisor_id ORDER BY supervisor_id) AS supervisores
                FROM control_supervisor_usuarios_sap
                WHERE activo IS TRUE
                GROUP BY codigo_sap
                HAVING count(*) > 1
                ORDER BY codigo_sap
                """
            )
            duplicate_active_sap = cursor.fetchall()

            cursor.execute(
                """
                WITH duplicate_codes AS (
                    SELECT codigo_sap
                    FROM control_supervisor_usuarios_sap
                    WHERE activo IS TRUE
                    GROUP BY codigo_sap
                    HAVING count(*) > 1
                )
                SELECT
                    mapping.supervisor_id,
                    supervisor.nombre,
                    supervisor.activo,
                    count(*) AS asignaciones_duplicadas,
                    min(mapping.created_at) AS primera_asignacion,
                    max(mapping.created_at) AS ultima_asignacion
                FROM control_supervisor_usuarios_sap AS mapping
                JOIN duplicate_codes USING (codigo_sap)
                JOIN control_supervisores AS supervisor
                  ON supervisor.id = mapping.supervisor_id
                WHERE mapping.activo IS TRUE
                GROUP BY mapping.supervisor_id, supervisor.nombre, supervisor.activo
                ORDER BY asignaciones_duplicadas DESC, mapping.supervisor_id
                """
            )
            duplicate_assignments_by_supervisor = cursor.fetchall()

            cursor.execute(
                """
                WITH duplicate_codes AS (
                    SELECT codigo_sap
                    FROM control_supervisor_usuarios_sap
                    WHERE activo IS TRUE
                    GROUP BY codigo_sap
                    HAVING count(*) > 1
                )
                SELECT count(*)
                FROM (
                    SELECT mapping.codigo_sap
                    FROM control_supervisor_usuarios_sap AS mapping
                    JOIN duplicate_codes USING (codigo_sap)
                    WHERE mapping.activo IS TRUE
                    GROUP BY mapping.codigo_sap
                    HAVING count(DISTINCT lower(btrim(mapping.cuenta))) > 1
                ) AS mismatches
                """
            )
            duplicate_sap_with_name_mismatch = cursor.fetchone()[0]

            all_duplicate_sets_include_supervisor_1 = (
                all(1 in row[2] for row in duplicate_active_sap)
                if duplicate_active_sap
                else None
            )

            cursor.execute(
                "SELECT to_regclass('uq_control_supervisor_sap_codigo_activo')"
            )
            existing_migration_index = cursor.fetchone()[0]

        dependency_status = dict(zip(REQUIRED_TABLES, dependencies, strict=True))
        checks = {
            "dependencies_present": all(dependency_status.values()),
            "legacy_id_types_are_integer": all(
                id_types.get(table) == "integer" for table in REQUIRED_TABLES
            ),
            "migration_tables_absent": not existing_migration_tables,
            "migration_index_absent": existing_migration_index is None,
            "active_sap_not_blank": blank_active_sap_count == 0,
            "active_sap_unique": not duplicate_active_sap,
        }

        return {
            "status": "PASS" if all(checks.values()) else "FAIL",
            "checks": checks,
            "dependencies": dependency_status,
            "id_types": id_types,
            "existing_migration_tables": existing_migration_tables,
            "existing_migration_index": existing_migration_index,
            "blank_active_sap_count": blank_active_sap_count,
            "duplicate_active_sap_count": len(duplicate_active_sap),
            "duplicate_active_sap_sample": [
                {
                    "codigo_sap": row[0],
                    "asignaciones_activas": row[1],
                    "supervisor_ids": row[2],
                }
                for row in duplicate_active_sap[:10]
            ],
            "duplicate_assignments_by_supervisor": [
                {
                    "supervisor_id": row[0],
                    "supervisor_nombre": row[1],
                    "supervisor_activo": row[2],
                    "asignaciones_duplicadas": row[3],
                    "primera_asignacion": row[4],
                    "ultima_asignacion": row[5],
                }
                for row in duplicate_assignments_by_supervisor
            ],
            "duplicate_sap_with_name_mismatch": duplicate_sap_with_name_mismatch,
            "all_duplicate_sets_include_supervisor_1": (
                all_duplicate_sets_include_supervisor_1
            ),
            "transaction": "rolled_back",
        }
    finally:
        connection.rollback()
        connection.close()
        engine.dispose()


if __name__ == "__main__":
    try:
        result = run_preflight()
    except Exception as exc:
        print(json.dumps({"status": "ERROR", "error": str(exc)}, ensure_ascii=False))
        raise SystemExit(2) from exc

    print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
    raise SystemExit(0 if result["status"] == "PASS" else 1)
