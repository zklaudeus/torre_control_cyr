"""Reconciliación CF: compara vía legacy vs vía unificada.

Uso:
    python scripts/run_reconciliation_cf.py --fecha 2026-06-24
    python scripts/run_reconciliation_cf.py --ultimos 7 --output resultados.json
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path

from sqlalchemy import create_engine, func, text

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings


DIAS_RECONCILIACION: int = 3
COLUMNAS_RESULTADOS = [
    "zona",
    "total_cortes_cf",
    "corte_en_poste_cf",
    "corte_en_empalme_cf",
    "corte_fuera_de_rango_cf",
    "visita_fallida_cf",
    "acum_09",
    "acum_10",
    "acum_11",
    "acum_12",
    "acum_13",
    "acum_14",
]


def formatear_hora(val) -> str | None:
    if val is None:
        return None
    return str(val)


def reconciliar_parametros(cursor) -> dict:
    """Compara control_parametros_cf_zona vs control_parametros_zona (tipo_brigada='CF')."""
    cursor.execute("""
        SELECT zona, brigadas_cf_contrato, activo
        FROM control_parametros_cf_zona
        ORDER BY zona
    """)
    legacy_rows = {r[0]: {"brigadas": r[1], "activo": r[2]} for r in cursor.fetchall()}

    cursor.execute("""
        SELECT zona, brigadas_contrato, activo
        FROM control_parametros_zona
        WHERE tipo_brigada = 'CF'
        ORDER BY zona
    """)
    unified_rows = {r[0]: {"brigadas": r[1], "activo": r[2]} for r in cursor.fetchall()}

    solo_legacy = sorted(set(legacy_rows) - set(unified_rows))
    solo_unified = sorted(set(unified_rows) - set(legacy_rows))
    comunes = sorted(set(legacy_rows) & set(unified_rows))

    discrepancias_activo = []
    discrepancias_brigadas = []
    for zona in comunes:
        l = legacy_rows[zona]
        u = unified_rows[zona]
        if l["activo"] != u["activo"]:
            discrepancias_activo.append({"zona": zona, "legacy": l["activo"], "unified": u["activo"]})
        if l["brigadas"] != u["brigadas"]:
            discrepancias_brigadas.append({"zona": zona, "legacy_brigadas": l["brigadas"], "unified_brigadas": u["brigadas"]})

    return {
        "zonas_solo_legacy": solo_legacy,
        "zonas_solo_unified": solo_unified,
        "zonas_comunes": len(comunes),
        "discrepancias_activo": discrepancias_activo,
        "discrepancias_brigadas_contrato": discrepancias_brigadas,
        "total_discrepancias": len(discrepancias_activo) + len(discrepancias_brigadas),
    }


def reconciliar_programacion(cursor, fechas: list[date]) -> dict:
    """Compara control_programacion_cf_zona vs control_programacion_zona (tipo_brigada='CF')."""
    fechas_str = [f.isoformat() for f in fechas]
    placeholders = ", ".join(f"'{f}'" for f in fechas_str)

    cursor.execute(f"""
        SELECT fecha_operacional, zona, reconexiones_programadas, total_reconexiones_ejecutadas, cortes_programados
        FROM control_programacion_cf_zona
        WHERE fecha_operacional IN ({placeholders})
        ORDER BY fecha_operacional, zona
    """)
    legacy = {}
    for r in cursor.fetchall():
        legacy[(r[0].isoformat(), r[1])] = {
            "reconexiones_programadas": r[2],
            "total_reconexiones_ejecutadas": r[3],
            "cortes_programados": r[4],
        }

    cursor.execute(f"""
        SELECT fecha_operacional, zona, reconexiones_programadas, corte_programado
        FROM control_programacion_zona
        WHERE tipo_brigada = 'CF' AND fecha_operacional IN ({placeholders})
        ORDER BY fecha_operacional, zona
    """)
    unified = {}
    for r in cursor.fetchall():
        unified[(r[0].isoformat(), r[1])] = {
            "reconexiones_programadas": r[2],
            "cortes_programados": r[3],
        }

    solo_legacy = sorted(set(legacy) - set(unified))
    solo_unified = sorted(set(unified) - set(legacy))
    comunes = sorted(set(legacy) & set(unified))

    discrepancias = []
    for key in comunes:
        l = legacy[key]
        u = unified[key]
        diffs = {}
        if l["reconexiones_programadas"] != u["reconexiones_programadas"]:
            diffs["reconexiones_programadas"] = {"legacy": l["reconexiones_programadas"], "unified": u["reconexiones_programadas"]}
        if l["cortes_programados"] != u["cortes_programados"]:
            diffs["cortes_programados"] = {"legacy": l["cortes_programados"], "unified": u["cortes_programados"]}
        if diffs:
            discrepancias.append({"fecha_zona": f"{key[0]} / {key[1]}", **diffs})

    return {
        "registros_legacy": len(legacy),
        "registros_unified": len(unified),
        "solo_legacy": [f"{k[0]} / {k[1]}" for k in solo_legacy],
        "solo_unified": [f"{k[0]} / {k[1]}" for k in solo_unified],
        "comunes": len(comunes),
        "discrepancias": discrepancias,
        "total_discrepancias": len(discrepancias),
    }


def reconciliar_resultados(cursor, fechas: list[date]) -> dict:
    """Compara resultados reales CF (legacy) vs resumen zona unificado.

    Ambos agregan desde control_brigadas_diario, pero el legacy
    usa control_parametros_cf_zona como lista de zonas, mientras el
    unificado usa control_parametros_zona.
    """
    fechas_str = [f.isoformat() for f in fechas]
    placeholders = ", ".join(f"'{f}'" for f in fechas_str)

    cursor.execute(f"""
        WITH legacy AS (
            SELECT z.zona, b.fecha_operacional,
                COALESCE(SUM(COALESCE(b.corte_en_poste, 0) + COALESCE(b.corte_en_empalme, 0) + COALESCE(b.corte_fuera_de_rango, 0)), 0) AS total_cortes,
                COALESCE(SUM(COALESCE(b.corte_en_poste, 0)), 0) AS corte_en_poste,
                COALESCE(SUM(COALESCE(b.corte_en_empalme, 0)), 0) AS corte_en_empalme,
                COALESCE(SUM(COALESCE(b.corte_fuera_de_rango, 0)), 0) AS corte_fuera_de_rango,
                COALESCE(SUM(COALESCE(b.visita_fallida, 0)), 0) AS visita_fallida,
                COALESCE(SUM(COALESCE(b.reconexiones_ejecutadas, 0)), 0) AS reconexiones_ejecutadas,
                COALESCE(SUM(COALESCE(b.acum_09, 0)), 0) AS acum_09,
                COALESCE(SUM(COALESCE(b.acum_10, 0)), 0) AS acum_10,
                COALESCE(SUM(COALESCE(b.acum_11, 0)), 0) AS acum_11,
                COALESCE(SUM(COALESCE(b.acum_12, 0)), 0) AS acum_12,
                COALESCE(SUM(COALESCE(b.acum_13, 0)), 0) AS acum_13,
                COALESCE(SUM(COALESCE(b.acum_14, 0)), 0) AS acum_14
            FROM control_parametros_cf_zona z
            LEFT JOIN control_brigadas_diario b
                ON b.zona = z.zona
                AND b.tipo_brigada = 'CF'
                AND b.fecha_operacional IN ({placeholders})
            GROUP BY z.zona, b.fecha_operacional
        ),
        unified AS (
            SELECT z.zona, b.fecha_operacional,
                COALESCE(SUM(COALESCE(b.corte_en_poste, 0) + COALESCE(b.corte_en_empalme, 0) + COALESCE(b.corte_fuera_de_rango, 0)), 0) AS total_cortes,
                COALESCE(SUM(COALESCE(b.corte_en_poste, 0)), 0) AS corte_en_poste,
                COALESCE(SUM(COALESCE(b.corte_en_empalme, 0)), 0) AS corte_en_empalme,
                COALESCE(SUM(COALESCE(b.corte_fuera_de_rango, 0)), 0) AS corte_fuera_de_rango,
                COALESCE(SUM(COALESCE(b.visita_fallida, 0)), 0) AS visita_fallida,
                COALESCE(SUM(COALESCE(b.reconexiones_ejecutadas, 0)), 0) AS reconexiones_ejecutadas,
                COALESCE(SUM(COALESCE(b.acum_09, 0)), 0) AS acum_09,
                COALESCE(SUM(COALESCE(b.acum_10, 0)), 0) AS acum_10,
                COALESCE(SUM(COALESCE(b.acum_11, 0)), 0) AS acum_11,
                COALESCE(SUM(COALESCE(b.acum_12, 0)), 0) AS acum_12,
                COALESCE(SUM(COALESCE(b.acum_13, 0)), 0) AS acum_13,
                COALESCE(SUM(COALESCE(b.acum_14, 0)), 0) AS acum_14
            FROM control_parametros_zona z
            LEFT JOIN control_brigadas_diario b
                ON b.zona = z.zona
                AND b.tipo_brigada = 'CF'
                AND b.fecha_operacional IN ({placeholders})
            WHERE z.tipo_brigada = 'CF' AND z.activo IS TRUE
            GROUP BY z.zona, b.fecha_operacional
        )
        SELECT COALESCE(l.zona, u.zona) AS zona,
               COALESCE(l.fecha_operacional, u.fecha_operacional) AS fecha_operacional,
               COALESCE(l.total_cortes, 0) AS l_total,
               COALESCE(u.total_cortes, 0) AS u_total,
               COALESCE(l.corte_en_poste, 0) AS l_poste,
               COALESCE(u.corte_en_poste, 0) AS u_poste,
               COALESCE(l.corte_en_empalme, 0) AS l_empalme,
               COALESCE(u.corte_en_empalme, 0) AS u_empalme,
               COALESCE(l.corte_fuera_de_rango, 0) AS l_fr,
               COALESCE(u.corte_fuera_de_rango, 0) AS u_fr,
               COALESCE(l.visita_fallida, 0) AS l_vf,
               COALESCE(u.visita_fallida, 0) AS u_vf,
               COALESCE(l.reconexiones_ejecutadas, 0) AS l_rec,
               COALESCE(u.reconexiones_ejecutadas, 0) AS u_rec,
               COALESCE(l.acum_09, 0) AS l_09,
               COALESCE(u.acum_09, 0) AS u_09,
               COALESCE(l.acum_10, 0) AS l_10,
               COALESCE(u.acum_10, 0) AS u_10,
               COALESCE(l.acum_11, 0) AS l_11,
               COALESCE(u.acum_11, 0) AS u_11,
               COALESCE(l.acum_12, 0) AS l_12,
               COALESCE(u.acum_12, 0) AS u_12,
               COALESCE(l.acum_13, 0) AS l_13,
               COALESCE(u.acum_13, 0) AS u_13,
               COALESCE(l.acum_14, 0) AS l_14,
               COALESCE(u.acum_14, 0) AS u_14
        FROM legacy l
        FULL OUTER JOIN unified u ON u.zona = l.zona AND u.fecha_operacional = l.fecha_operacional
        ORDER BY COALESCE(l.fecha_operacional, u.fecha_operacional), COALESCE(l.zona, u.zona)
    """)
    rows = cursor.fetchall()
    columnas_comp = ["total_cortes", "corte_en_poste", "corte_en_empalme", "corte_fuera_de_rango",
                     "visita_fallida", "reconexiones_ejecutadas",
                     "acum_09", "acum_10", "acum_11", "acum_12", "acum_13", "acum_14"]

    discrepancias = []
    total_filas = 0
    filas_con_data = 0
    for row in rows:
        zona = row[0]
        fecha_op = row[1].isoformat() if row[1] else "SIN FECHA"
        total_filas += 1
        if zona is None:
            continue
        filas_con_data += 1
        i = 2
        diffs = {}
        for col in columnas_comp:
            l_val = row[i]
            u_val = row[i + 1]
            if l_val != u_val:
                diffs[col] = {"legacy": l_val, "unified": u_val}
            i += 2
        if diffs:
            discrepancias.append({"zona": zona, "fecha": fecha_op, "diferencias": diffs})

    return {
        "total_filas": total_filas,
        "filas_con_data": filas_con_data,
        "discrepancias": discrepancias,
        "total_discrepancias": len(discrepancias),
    }


def reconciliar_generales(cursor) -> dict:
    """Reporta el estado de control_parametros_cf_generales."""
    cursor.execute("SELECT * FROM control_parametros_cf_generales LIMIT 1")
    cols = [desc[0] for desc in cursor.description]
    row = cursor.fetchone()
    if row:
        return {"existe": True, "datos": dict(zip(cols, row))}
    return {"existe": False, "datos": None}


def run_reconciliation(fechas: list[date]) -> dict:
    if not settings.DATABASE_URL:
        raise RuntimeError("DATABASE_URL no está configurada")

    engine = create_engine(settings.DATABASE_URL)
    connection = engine.raw_connection()
    connection.set_session(readonly=True, autocommit=False)

    try:
        with connection.cursor() as cursor:
            generales = reconciliar_generales(cursor)
            parametros = reconciliar_parametros(cursor)
            programacion = reconciliar_programacion(cursor, fechas)
            resultados = reconciliar_resultados(cursor, fechas)

        discrepancias_totales = (
            parametros["total_discrepancias"]
            + programacion["total_discrepancias"]
            + resultados["total_discrepancias"]
        )

        return {
            "status": "PASS" if discrepancias_totales == 0 else "DISCREPANCIAS",
            "resumen": {
                "fechas_evaluadas": [f.isoformat() for f in sorted(fechas)],
                "parametros_zona": {
                    "total_discrepancias": parametros["total_discrepancias"],
                    "detalle": parametros,
                },
                "programacion_diaria": {
                    "total_discrepancias": programacion["total_discrepancias"],
                    "detalle": programacion,
                },
                "resultados_agregados": {
                    "total_discrepancias": resultados["total_discrepancias"],
                    "detalle": resultados,
                },
                "parametros_generales": generales,
                "total_discrepancias_general": discrepancias_totales,
            },
            "recomendacion": (
                "Sin discrepancias — las vías legacy y unificada están en paridad."
                if discrepancias_totales == 0
                else (
                    f"Se encontraron {discrepancias_totales} discrepancia(s). "
                    "Revisar detalle antes de proceder con retiro de rutas/tablas CF legacy."
                )
            ),
        }
    finally:
        connection.rollback()
        connection.close()
        engine.dispose()


def main():
    parser = argparse.ArgumentParser(description="Reconciliación CF: legacy vs unificado")
    parser.add_argument("--fecha", type=str, help="Fecha específica (YYYY-MM-DD)")
    parser.add_argument("--ultimos", type=int, default=DIAS_RECONCILIACION, help=f"Días hacia atrás (default: {DIAS_RECONCILIACION})")
    parser.add_argument("--output", type=str, help="Archivo JSON de salida")
    args = parser.parse_args()

    hoy = date.today()
    if args.fecha:
        fechas = [date.fromisoformat(args.fecha)]
    else:
        fechas = [hoy - timedelta(days=i) for i in range(args.ultimos)]

    try:
        result = run_reconciliation(fechas)
    except Exception as exc:
        print(json.dumps({"status": "ERROR", "error": str(exc)}, ensure_ascii=False))
        raise SystemExit(2) from exc

    output = json.dumps(result, ensure_ascii=False, indent=2, default=str)
    if args.output:
        Path(args.output).write_text(output, encoding="utf-8")
        print(f"Resultados guardados en {args.output}")
    else:
        print(output)

    if result["status"] == "DISCREPANCIAS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
