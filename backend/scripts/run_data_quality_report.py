"""Reporte de calidad de datos operacionales.

Evalúa integridad, consistencia y completitud contra umbrales
configurables. Solo lectura.

Uso:
    python scripts/run_data_quality_report.py --ultimos 30 --tolerancia 0.05
    python scripts/run_data_quality_report.py --fecha-ini 2026-06-01 --fecha-fin 2026-06-24 --output calidad.json
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path

from sqlalchemy import create_engine

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings


UMBRAL_TOLERANCIA: float = 0.05


def run_quality_report(fecha_ini: date, fecha_fin: date, tolerancia: float) -> dict:
    if not settings.DATABASE_URL:
        raise RuntimeError("DATABASE_URL no está configurada")

    engine = create_engine(settings.DATABASE_URL)
    connection = engine.raw_connection()
    connection.set_session(readonly=True, autocommit=False)

    alertas: list[str] = []
    indicadores: dict[str, object] = {}

    try:
        with connection.cursor() as cursor:
            # --- 1. Cobertura de fechas ---
            cursor.execute("""
                SELECT min(fecha_operacional), max(fecha_operacional),
                       count(DISTINCT fecha_operacional)
                FROM control_brigadas_diario
                WHERE fecha_operacional BETWEEN %s AND %s
            """, [fecha_ini, fecha_fin])
            min_date, max_date, dias_con_data = cursor.fetchone()
            total_dias = (fecha_fin - fecha_ini).days + 1
            cobertura = dias_con_data / total_dias if total_dias > 0 else 0.0
            indicadores["cobertura_dias"] = {
                "rango": f"{fecha_ini} a {fecha_fin}",
                "dias_esperados": total_dias,
                "dias_con_data": dias_con_data,
                "cobertura": round(cobertura, 4),
            }
            if cobertura < (1.0 - tolerancia):
                alertas.append(f"Cobertura de días {cobertura:.1%} baja (tolerancia {tolerancia:.1%})")

            # --- 2. Completitud de codigo_sap ---
            cursor.execute("""
                SELECT
                    count(*) AS total,
                    count(*) FILTER (WHERE codigo_sap IS NULL OR btrim(codigo_sap) = '') AS sin_sap,
                    count(*) FILTER (WHERE zona IS NULL OR btrim(zona) = '') AS sin_zona,
                    count(*) FILTER (WHERE tipo_brigada IS NULL) AS sin_tipo,
                    count(*) FILTER (WHERE usuario IS NULL OR btrim(usuario) = '') AS sin_usuario
                FROM control_brigadas_diario
                WHERE fecha_operacional BETWEEN %s AND %s
            """, [fecha_ini, fecha_fin])
            total, sin_sap, sin_zona, sin_tipo, sin_usuario = cursor.fetchone()
            for nombre, valor in [("sin_sap", sin_sap), ("sin_zona", sin_zona),
                                  ("sin_tipo", sin_tipo), ("sin_usuario", sin_usuario)]:
                if total > 0 and valor / total > tolerancia:
                    alertas.append(f"{nombre}: {valor}/{total} ({valor/total:.1%}) supera tolerancia {tolerancia:.1%}")
            indicadores["completitud"] = {
                "total_filas": total,
                "sin_codigo_sap": sin_sap,
                "sin_zona": sin_zona,
                "sin_tipo_brigada": sin_tipo,
                "sin_usuario": sin_usuario,
            }

            # --- 3. Duplicados (fecha_operacional, codigo_sap) ---
            cursor.execute("""
                SELECT count(*), coalesce(sum(cantidad - 1), 0)
                FROM (
                    SELECT fecha_operacional, codigo_sap, count(*) AS cantidad
                    FROM control_brigadas_diario
                    WHERE codigo_sap IS NOT NULL AND btrim(codigo_sap) <> ''
                      AND fecha_operacional BETWEEN %s AND %s
                    GROUP BY fecha_operacional, codigo_sap
                    HAVING count(*) > 1
                ) AS dups
            """, [fecha_ini, fecha_fin])
            grupos_dup, filas_extra = cursor.fetchone()
            indicadores["duplicados"] = {
                "grupos_duplicados": grupos_dup,
                "filas_extra": filas_extra,
            }
            if grupos_dup > 0:
                alertas.append(f"{grupos_dup} grupo(s) duplicado(s) ({filas_extra} filas extra)")

            # --- 4. Huérfanos (sin maestro activo) ---
            cursor.execute("""
                SELECT count(*)
                FROM control_brigadas_diario AS d
                LEFT JOIN control_supervisor_usuarios_sap AS m
                  ON m.codigo_sap = d.codigo_sap AND m.activo IS TRUE
                WHERE d.codigo_sap IS NOT NULL AND btrim(d.codigo_sap) <> ''
                  AND d.fecha_operacional BETWEEN %s AND %s
                  AND m.id IS NULL
            """, [fecha_ini, fecha_fin])
            huerfanos = cursor.fetchone()[0]
            indicadores["huerfanos"] = {"sin_maestro_activo": huerfanos}
            if total > 0 and huerfanos / total > tolerancia:
                alertas.append(f"Huerfanos: {huerfanos}/{total} ({huerfanos/total:.1%}) supera tolerancia {tolerancia:.1%}")

            # --- 5. Brigadas sin tipo_brigada ---
            cursor.execute("""
                SELECT count(*)
                FROM control_brigadas_diario
                WHERE fecha_operacional BETWEEN %s AND %s
                  AND (tipo_brigada IS NULL OR tipo_brigada NOT IN ('PXQ', 'CF'))
            """, [fecha_ini, fecha_fin])
            tipo_invalido = cursor.fetchone()[0]
            indicadores["tipo_brigada"] = {"invalido_o_nulo": tipo_invalido}
            if tipo_invalido > 0:
                alertas.append(f"{tipo_invalido} fila(s) con tipo_brigada inválido/nulo")

            # --- 6. Distribución PXQ vs CF ---
            cursor.execute("""
                SELECT tipo_brigada, count(*)
                FROM control_brigadas_diario
                WHERE fecha_operacional BETWEEN %s AND %s
                  AND tipo_brigada IN ('PXQ', 'CF')
                GROUP BY tipo_brigada
            """, [fecha_ini, fecha_fin])
            distribucion = {r[0]: r[1] for r in cursor.fetchall()}
            indicadores["distribucion_tipo_brigada"] = distribucion

            # --- 7. Zonas activas sin datos ---
            cursor.execute("""
                SELECT z.zona, z.tipo_brigada
                FROM control_parametros_zona z
                WHERE z.activo IS TRUE
                  AND NOT EXISTS (
                    SELECT 1 FROM control_brigadas_diario d
                    WHERE d.zona = z.zona AND d.tipo_brigada = z.tipo_brigada
                      AND d.fecha_operacional BETWEEN %s AND %s
                  )
                ORDER BY z.zona, z.tipo_brigada
            """, [fecha_ini, fecha_fin])
            zonas_sin_data = cursor.fetchall()
            indicadores["zonas_activas_sin_datos"] = [
                {"zona": r[0], "tipo_brigada": r[1]} for r in zonas_sin_data
            ]
            if zonas_sin_data:
                alertas.append(f"{len(zonas_sin_data)} zona(s) activa(s) sin datos en el período")

            # --- 8. Corte por tipo vs esperado ---
            cursor.execute("""
                SELECT tipo_brigada,
                       count(*) FILTER (WHERE corte_en_poste > 0) AS con_poste,
                       count(*) FILTER (WHERE corte_en_empalme > 0) AS con_empalme,
                       count(*) FILTER (WHERE corte_fuera_de_rango > 0) AS con_fr
                FROM control_brigadas_diario
                WHERE fecha_operacional BETWEEN %s AND %s
                  AND tipo_brigada IN ('PXQ', 'CF')
                GROUP BY tipo_brigada
                ORDER BY tipo_brigada
            """, [fecha_ini, fecha_fin])
            distribucion_corte = []
            for r in cursor.fetchall():
                distribucion_corte.append({
                    "tipo_brigada": r[0],
                    "con_corte_poste": r[1],
                    "con_corte_empalme": r[2],
                    "con_corte_fuera_rango": r[3],
                })
            indicadores["distribucion_tipo_corte"] = distribucion_corte

            # --- 9. Integridad de control_programacion_cf_zona vs control_programacion_zona ---
            cursor.execute("""
                SELECT
                    (SELECT count(*) FROM control_programacion_cf_zona
                     WHERE fecha_operacional BETWEEN %s AND %s) AS legacy,
                    (SELECT count(*) FROM control_programacion_zona
                     WHERE tipo_brigada = 'CF' AND fecha_operacional BETWEEN %s AND %s) AS unified
            """, [fecha_ini, fecha_fin, fecha_ini, fecha_fin])
            prog_legacy, prog_unified = cursor.fetchone()
            indicadores["programacion_cf_dual"] = {
                "legacy_programacion_cf_zona": prog_legacy,
                "unified_programacion_zona_cf": prog_unified,
                "diferencia": prog_legacy - prog_unified,
            }
            if prog_legacy != prog_unified:
                alertas.append(
                    f"Programación CF: legacy={prog_legacy} vs unified={prog_unified} "
                    f"(diferencia={prog_legacy - prog_unified})"
                )

        result = {
            "status": "PASS" if not alertas else "ALERTAS",
            "periodo": {"inicio": fecha_ini.isoformat(), "fin": fecha_fin.isoformat()},
            "tolerancia": tolerancia,
            "indicadores": indicadores,
            "alertas": alertas,
        }
        return result
    finally:
        connection.rollback()
        connection.close()
        engine.dispose()


def main():
    parser = argparse.ArgumentParser(description="Reporte de calidad de datos operacionales")
    parser.add_argument("--fecha-ini", type=str, help="Fecha inicio (YYYY-MM-DD)")
    parser.add_argument("--fecha-fin", type=str, help="Fecha fin (YYYY-MM-DD)")
    parser.add_argument("--ultimos", type=int, default=30, help="Días hacia atrás (default: 30)")
    parser.add_argument("--tolerancia", type=float, default=UMBRAL_TOLERANCIA,
                        help=f"Tolerancia para alertas (default: {UMBRAL_TOLERANCIA})")
    parser.add_argument("--output", type=str, help="Archivo JSON de salida")
    args = parser.parse_args()

    hoy = date.today()
    if args.fecha_ini and args.fecha_fin:
        fecha_ini = date.fromisoformat(args.fecha_ini)
        fecha_fin = date.fromisoformat(args.fecha_fin)
    else:
        fecha_fin = hoy
        fecha_ini = hoy - timedelta(days=args.ultimos)

    try:
        result = run_quality_report(fecha_ini, fecha_fin, args.tolerancia)
    except Exception as exc:
        print(json.dumps({"status": "ERROR", "error": str(exc)}, ensure_ascii=False))
        raise SystemExit(2) from exc

    output = json.dumps(result, ensure_ascii=False, indent=2, default=str)
    if args.output:
        Path(args.output).write_text(output, encoding="utf-8")
        print(f"Reporte guardado en {args.output}")
    else:
        print(output)

    if result["status"] == "ALERTAS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
