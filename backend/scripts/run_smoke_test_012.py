"""Prueba las restricciones principales de 012 y revierte todos los datos de prueba."""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings


def expect_database_error(
    cursor: Any,
    savepoint: str,
    statement: str,
    parameters: tuple[object, ...],
    expected_sqlstate: str,
) -> None:
    cursor.execute(f"SAVEPOINT {savepoint}")
    try:
        cursor.execute(statement, parameters)
    except Exception as exc:
        sqlstate = getattr(exc, "pgcode", None)
        cursor.execute(f"ROLLBACK TO SAVEPOINT {savepoint}")
        cursor.execute(f"RELEASE SAVEPOINT {savepoint}")
        if sqlstate != expected_sqlstate:
            raise RuntimeError(
                f"{savepoint}: SQLSTATE esperado={expected_sqlstate}, recibido={sqlstate}"
            ) from exc
    else:
        cursor.execute(f"ROLLBACK TO SAVEPOINT {savepoint}")
        cursor.execute(f"RELEASE SAVEPOINT {savepoint}")
        raise RuntimeError(f"{savepoint}: la base aceptó un registro inválido")


def run_smoke_test() -> dict[str, object]:
    if not settings.DATABASE_URL:
        raise RuntimeError("DATABASE_URL no está configurada")

    engine = create_engine(settings.DATABASE_URL)
    connection = engine.raw_connection()
    connection.set_session(readonly=False, autocommit=False)

    valid_date = date(2099, 1, 4)
    absence_date = date(2099, 1, 5)

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT mapping.codigo_sap, mapping.cuenta, mapping.tipo_brigada,
                       mapping.supervisor_id
                FROM control_supervisor_usuarios_sap AS mapping
                JOIN control_supervisores AS supervisor
                  ON supervisor.id = mapping.supervisor_id
                WHERE mapping.activo IS TRUE
                  AND supervisor.activo IS TRUE
                ORDER BY mapping.id
                LIMIT 2
                """
            )
            mappings = cursor.fetchall()
            if len(mappings) < 2:
                raise RuntimeError("Se requieren al menos dos cuentas SAP activas")

            codigo_sap, cuenta, tipo_brigada, supervisor_id = mappings[0]
            other_codigo_sap = mappings[1][0]

            cursor.execute(
                "SELECT id FROM control_usuarios WHERE activo IS TRUE ORDER BY id LIMIT 1"
            )
            user_row = cursor.fetchone()
            if user_row is None:
                raise RuntimeError("No existe un usuario activo para auditar la prueba")
            usuario_id = user_row[0]

            cursor.execute(
                """
                INSERT INTO bitacoras_supervisor_diarias (
                    fecha_operacional, supervisor_id, estado,
                    fecha_cierre, cerrada_por_id
                )
                VALUES (%s, %s, 'CERRADA_TC', now(), %s)
                RETURNING id
                """,
                (valid_date, supervisor_id, usuario_id),
            )
            bitacora_id = cursor.fetchone()[0]

            cursor.execute(
                """
                INSERT INTO rendimiento_tecnico_diario (
                    fecha_operacional, codigo_sap, usuario, supervisor_id,
                    tipo_brigada, corte_en_poste, corte_en_empalme,
                    corte_fuera_de_rango, visita_fallida, reconexiones,
                    cortes_productivos, meta_aplicada, cumplimiento_pct,
                    es_evaluable, estado_diario, bitacora_id
                )
                VALUES (
                    %s, %s, %s, %s, %s, 10, 5, 2, 1, 0,
                    17, 25, 68.00, TRUE, 'RECUPERACION', %s
                )
                RETURNING id
                """,
                (
                    valid_date,
                    codigo_sap,
                    cuenta,
                    supervisor_id,
                    tipo_brigada,
                    bitacora_id,
                ),
            )
            rendimiento_id = cursor.fetchone()[0]

            cursor.execute(
                """
                INSERT INTO rendimiento_tecnico_causas_fallidas (
                    fecha_operacional, codigo_sap, rendimiento_diario_id,
                    causa_fallida, cantidad, origen
                )
                VALUES (%s, %s, %s, 'CASA_CERRADA', 1, 'SMOKE_TEST')
                """,
                (valid_date, codigo_sap, rendimiento_id),
            )

            cursor.execute(
                """
                INSERT INTO rendimiento_tecnico_ausencias (
                    codigo_sap, fecha_operacional, causa, registrada_por_id
                )
                VALUES (%s, %s, 'PERMISO', %s)
                RETURNING id
                """,
                (codigo_sap, absence_date, usuario_id),
            )
            ausencia_id = cursor.fetchone()[0]

            cursor.execute(
                """
                INSERT INTO rendimiento_tecnico_diario (
                    fecha_operacional, codigo_sap, usuario, supervisor_id,
                    tipo_brigada, cortes_productivos, meta_aplicada,
                    cumplimiento_pct, es_evaluable, motivo_no_evaluable,
                    ausencia_id
                )
                VALUES (%s, %s, %s, %s, %s, 0, 25, 0, FALSE, 'PERMISO', %s)
                """,
                (
                    absence_date,
                    codigo_sap,
                    cuenta,
                    supervisor_id,
                    tipo_brigada,
                    ausencia_id,
                ),
            )

            cursor.execute(
                """
                INSERT INTO rendimiento_tecnico_actual (
                    codigo_sap, fase_actual, estado_productivo_actual,
                    dias_consecutivos_bajo_50,
                    dias_consecutivos_alto_desempeno,
                    advertencias_fase2, fecha_ultima_evaluacion
                )
                VALUES (%s, 1, 'RECUPERACION', 0, 0, 0, %s)
                """,
                (codigo_sap, valid_date),
            )

            cursor.execute(
                """
                INSERT INTO rendimiento_tecnico_historial (
                    codigo_sap, tipo_cambio, estado_anterior, estado_nuevo,
                    regla_disparadora
                )
                VALUES (%s, 'RECALCULO', 'SIN_EVALUACION', 'RECUPERACION',
                        'SMOKE_TEST_012')
                """,
                (codigo_sap,),
            )

            cursor.execute(
                """
                INSERT INTO rendimiento_tecnico_advertencias (
                    codigo_sap, fecha_operacional, fase_al_momento,
                    numero_advertencia, motivo, registrada_por_id
                )
                VALUES (%s, %s, 2, 1, 'SMOKE_TEST_012', %s)
                """,
                (codigo_sap, valid_date, usuario_id),
            )

            expect_database_error(
                cursor,
                "invalid_formula",
                """
                INSERT INTO rendimiento_tecnico_diario (
                    fecha_operacional, codigo_sap, usuario,
                    cortes_productivos, corte_en_poste, meta_aplicada,
                    cumplimiento_pct, es_evaluable, motivo_no_evaluable
                )
                VALUES (%s, %s, %s, 99, 1, 25, 0, FALSE, 'PRUEBA')
                """,
                (date(2099, 1, 6), codigo_sap, cuenta),
                "23514",
            )

            expect_database_error(
                cursor,
                "invalid_evaluability",
                """
                INSERT INTO rendimiento_tecnico_diario (
                    fecha_operacional, codigo_sap, usuario,
                    cortes_productivos, meta_aplicada, cumplimiento_pct,
                    es_evaluable
                )
                VALUES (%s, %s, %s, 0, 25, 0, FALSE)
                """,
                (date(2099, 1, 7), codigo_sap, cuenta),
                "23514",
            )

            expect_database_error(
                cursor,
                "invalid_fallida_link",
                """
                INSERT INTO rendimiento_tecnico_causas_fallidas (
                    fecha_operacional, codigo_sap, rendimiento_diario_id,
                    causa_fallida, cantidad
                )
                VALUES (%s, %s, %s, 'VINCULO_CRUZADO', 1)
                """,
                (valid_date, other_codigo_sap, rendimiento_id),
                "23503",
            )

            cursor.execute(
                """
                SELECT
                    (SELECT count(*) FROM bitacoras_supervisor_diarias),
                    (SELECT count(*) FROM rendimiento_tecnico_ausencias),
                    (SELECT count(*) FROM rendimiento_tecnico_diario),
                    (SELECT count(*) FROM rendimiento_tecnico_actual),
                    (SELECT count(*) FROM rendimiento_tecnico_historial),
                    (SELECT count(*) FROM rendimiento_tecnico_advertencias),
                    (SELECT count(*) FROM rendimiento_tecnico_causas_fallidas)
                """
            )
            inserted_counts = cursor.fetchone()

            expected_counts = (1, 1, 2, 1, 1, 1, 1)
            if inserted_counts != expected_counts:
                raise RuntimeError(
                    f"Conteos de prueba inesperados: {inserted_counts}; "
                    f"esperados: {expected_counts}"
                )

        connection.rollback()
        return {
            "status": "PASS",
            "valid_rows_visible_inside_transaction": inserted_counts,
            "rejected_invalid_cases": [
                "cortes_productivos_inconsistentes",
                "dia_no_evaluable_sin_motivo",
                "causa_fallida_vinculada_a_otro_sap",
            ],
            "transaction": "rolled_back",
        }
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
        engine.dispose()


if __name__ == "__main__":
    try:
        result = run_smoke_test()
    except Exception as exc:
        print(json.dumps({"status": "ERROR", "error": str(exc)}, ensure_ascii=False))
        raise SystemExit(2) from exc

    print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
