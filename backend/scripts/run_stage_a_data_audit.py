"""Auditoría de solo lectura para la Etapa A del módulo de rendimiento."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy import create_engine

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings


def run_audit() -> dict[str, object]:
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
                    count(*) AS filas,
                    count(DISTINCT codigo_sap) FILTER (
                        WHERE codigo_sap IS NOT NULL AND btrim(codigo_sap) <> ''
                    ) AS sap_distintos,
                    min(fecha_operacional),
                    max(fecha_operacional)
                FROM control_brigadas_diario
                """
            )
            daily_summary = cursor.fetchone()

            cursor.execute(
                """
                WITH duplicate_groups AS (
                    SELECT fecha_operacional, codigo_sap, count(*) AS cantidad
                    FROM control_brigadas_diario
                    WHERE codigo_sap IS NOT NULL AND btrim(codigo_sap) <> ''
                    GROUP BY fecha_operacional, codigo_sap
                    HAVING count(*) > 1
                )
                SELECT count(*), coalesce(sum(cantidad - 1), 0)
                FROM duplicate_groups
                """
            )
            duplicate_groups, duplicate_extra_rows = cursor.fetchone()

            cursor.execute(
                """
                SELECT count(*)
                FROM (
                    SELECT fecha_operacional, codigo_sap
                    FROM control_brigadas_diario
                    WHERE codigo_sap IS NOT NULL AND btrim(codigo_sap) <> ''
                    GROUP BY fecha_operacional, codigo_sap
                    HAVING count(*) > 1
                       AND (
                           count(DISTINCT coalesce(zona, '')) > 1
                           OR count(DISTINCT coalesce(tipo_brigada, '')) > 1
                           OR count(DISTINCT coalesce(usuario, '')) > 1
                       )
                ) AS conflicting_duplicates
                """
            )
            conflicting_duplicate_groups = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT fecha_operacional, codigo_sap, count(*) AS cantidad
                FROM control_brigadas_diario
                WHERE codigo_sap IS NOT NULL AND btrim(codigo_sap) <> ''
                GROUP BY fecha_operacional, codigo_sap
                HAVING count(*) > 1
                ORDER BY fecha_operacional DESC, codigo_sap
                LIMIT 20
                """
            )
            duplicate_sample = cursor.fetchall()

            cursor.execute(
                """
                SELECT count(*)
                FROM control_brigadas_diario
                WHERE codigo_sap IS NULL OR btrim(codigo_sap) = ''
                """
            )
            blank_daily_sap_count = cursor.fetchone()[0]

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
            duplicate_active_master_sap_count = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT count(*)
                FROM control_supervisor_usuarios_sap
                WHERE activo IS TRUE
                """
            )
            active_master_assignments = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT count(*)
                FROM control_brigadas_diario AS daily
                LEFT JOIN control_supervisor_usuarios_sap AS master
                  ON master.codigo_sap = daily.codigo_sap
                 AND master.activo IS TRUE
                WHERE daily.codigo_sap IS NOT NULL
                  AND btrim(daily.codigo_sap) <> ''
                  AND master.id IS NULL
                """
            )
            daily_rows_without_active_master = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT daily.codigo_sap, count(*) AS filas
                FROM control_brigadas_diario AS daily
                LEFT JOIN control_supervisor_usuarios_sap AS master
                  ON master.codigo_sap = daily.codigo_sap
                 AND master.activo IS TRUE
                WHERE daily.codigo_sap IS NOT NULL
                  AND btrim(daily.codigo_sap) <> ''
                  AND master.id IS NULL
                GROUP BY daily.codigo_sap
                ORDER BY filas DESC, daily.codigo_sap
                LIMIT 20
                """
            )
            inactive_or_missing_master_sample = cursor.fetchall()

            cursor.execute(
                """
                SELECT count(*)
                FROM control_brigadas_diario AS daily
                JOIN control_supervisor_usuarios_sap AS master
                  ON master.codigo_sap = daily.codigo_sap
                 AND master.activo IS TRUE
                WHERE daily.usuario IS NOT NULL
                  AND lower(btrim(daily.usuario)) <> lower(btrim(master.cuenta))
                """
            )
            daily_name_mismatch_rows = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT count(*)
                FROM (
                    SELECT codigo_sap
                    FROM control_brigadas_diario
                    WHERE codigo_sap IS NOT NULL
                      AND btrim(codigo_sap) <> ''
                      AND usuario IS NOT NULL
                      AND btrim(usuario) <> ''
                    GROUP BY codigo_sap
                    HAVING count(DISTINCT lower(btrim(usuario))) > 1
                ) AS name_variants
                """
            )
            sap_with_multiple_daily_names = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT daily.codigo_sap, count(*) AS filas_diferentes
                FROM control_brigadas_diario AS daily
                JOIN control_supervisor_usuarios_sap AS master
                  ON master.codigo_sap = daily.codigo_sap
                 AND master.activo IS TRUE
                WHERE daily.usuario IS NOT NULL
                  AND lower(btrim(daily.usuario)) <> lower(btrim(master.cuenta))
                GROUP BY daily.codigo_sap
                ORDER BY filas_diferentes DESC, daily.codigo_sap
                LIMIT 20
                """
            )
            name_mismatch_sample = cursor.fetchall()

        return {
            "status": "PASS",
            "daily_summary": {
                "rows": daily_summary[0],
                "distinct_sap": daily_summary[1],
                "min_date": daily_summary[2],
                "max_date": daily_summary[3],
            },
            "duplicate_date_sap_groups": duplicate_groups,
            "duplicate_extra_rows": duplicate_extra_rows,
            "conflicting_duplicate_groups": conflicting_duplicate_groups,
            "duplicate_sample": [
                {
                    "fecha_operacional": row[0],
                    "codigo_sap": row[1],
                    "cantidad": row[2],
                }
                for row in duplicate_sample
            ],
            "blank_daily_sap_count": blank_daily_sap_count,
            "active_master_assignments": active_master_assignments,
            "duplicate_active_master_sap_count": duplicate_active_master_sap_count,
            "daily_rows_without_active_master": daily_rows_without_active_master,
            "inactive_or_missing_master_sample": [
                {"codigo_sap": row[0], "rows": row[1]}
                for row in inactive_or_missing_master_sample
            ],
            "daily_name_mismatch_rows": daily_name_mismatch_rows,
            "sap_with_multiple_daily_names": sap_with_multiple_daily_names,
            "name_mismatch_sample": [
                {"codigo_sap": row[0], "rows": row[1]}
                for row in name_mismatch_sample
            ],
            "transaction": "rolled_back",
        }
    finally:
        connection.rollback()
        connection.close()
        engine.dispose()


if __name__ == "__main__":
    try:
        result = run_audit()
    except Exception as exc:
        print(json.dumps({"status": "ERROR", "error": str(exc)}, ensure_ascii=False))
        raise SystemExit(2) from exc

    print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
