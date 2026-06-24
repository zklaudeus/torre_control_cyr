"""Ejecuta y verifica la remediación autorizada previa a la migración 012."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy import create_engine

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings


REMEDIATION_FILE = (
    BACKEND_ROOT
    / "sql"
    / "remediation"
    / "012_resolver_sap_activos_duplicados.sql"
)
AUTHORIZED_CHANGE_COUNT = 23


def run_remediation() -> dict[str, object]:
    if not settings.DATABASE_URL:
        raise RuntimeError("DATABASE_URL no está configurada")

    sql = REMEDIATION_FILE.read_text(encoding="utf-8")
    if not sql.rstrip().endswith("COMMIT;"):
        raise RuntimeError("La remediación no termina en COMMIT explícito")

    # El commit final se controla aquí para validar antes de hacerlo permanente.
    sql_without_commit = sql.rstrip()[: -len("COMMIT;")]

    engine = create_engine(settings.DATABASE_URL)
    connection = engine.raw_connection()
    connection.set_session(readonly=False, autocommit=False)

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT legacy.codigo_sap
                FROM control_supervisor_usuarios_sap AS legacy
                WHERE legacy.activo IS TRUE
                  AND legacy.supervisor_id = 1
                  AND EXISTS (
                      SELECT 1
                      FROM control_supervisor_usuarios_sap AS vigente
                      WHERE vigente.codigo_sap = legacy.codigo_sap
                        AND vigente.activo IS TRUE
                        AND vigente.supervisor_id <> legacy.supervisor_id
                  )
                ORDER BY legacy.codigo_sap
                """
            )
            planned_codes = [row[0] for row in cursor.fetchall()]

        connection.rollback()

        if len(planned_codes) != AUTHORIZED_CHANGE_COUNT:
            raise RuntimeError(
                "La cantidad a modificar cambió: "
                f"esperada={AUTHORIZED_CHANGE_COUNT}, actual={len(planned_codes)}"
            )

        with connection.cursor() as cursor:
            cursor.execute(sql_without_commit)

            cursor.execute(
                "SELECT count(*) FROM remediation_012_asignaciones_desactivadas"
            )
            updated_count = cursor.fetchone()[0]

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
            remaining_duplicate_count = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT count(*)
                FROM control_supervisor_usuarios_sap
                WHERE supervisor_id = 1
                  AND activo IS FALSE
                  AND codigo_sap = ANY(%s)
                """,
                (planned_codes,),
            )
            verified_inactive_count = cursor.fetchone()[0]

        if updated_count != AUTHORIZED_CHANGE_COUNT:
            raise RuntimeError(
                f"Se actualizaron {updated_count} filas; se esperaban "
                f"{AUTHORIZED_CHANGE_COUNT}"
            )
        if remaining_duplicate_count != 0:
            raise RuntimeError(
                f"Persisten {remaining_duplicate_count} SAP activos duplicados"
            )
        if verified_inactive_count != AUTHORIZED_CHANGE_COUNT:
            raise RuntimeError(
                "No fue posible verificar todas las asignaciones desactivadas"
            )

        connection.commit()
        return {
            "status": "PASS",
            "updated_count": updated_count,
            "verified_inactive_count": verified_inactive_count,
            "remaining_duplicate_active_sap_count": remaining_duplicate_count,
            "transaction": "committed",
        }
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
        engine.dispose()


if __name__ == "__main__":
    try:
        result = run_remediation()
    except Exception as exc:
        print(json.dumps({"status": "ERROR", "error": str(exc)}, ensure_ascii=False))
        raise SystemExit(2) from exc

    print(json.dumps(result, ensure_ascii=False, indent=2))
