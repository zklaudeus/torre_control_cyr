"""Backfill rendimiento_tecnico_diario desde control_brigadas_diario.

Uso:
    python scripts/backfill_rendimiento.py --fecha 2026-06-23
    python scripts/backfill_rendimiento.py --fecha 2026-06-23 --dry-run

Cálculos:
    cortes_productivos = corte_en_poste + corte_en_empalme + corte_fuera_de_rango
    meta_aplicada      = 30 si PXQ, 6 si CF
    cumplimiento_pct   = (cortes_productivos / meta_aplicada) * 100
    estado_diario:
        CRITICO        = cumplimiento < 50%
        RECUPERACION   = cumplimiento entre 50% y 79%
        ESTABLE        = cumplimiento entre 80% y 99%
        ALTO_DESEMPENO = cumplimiento >= 100%
"""

from __future__ import annotations
import argparse
import sys
from datetime import date
from pathlib import Path
from decimal import Decimal

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from sqlalchemy import create_engine, text


META_POR_TIPO = {"PXQ": 25, "CF": 6}


def calcular_estado(cumplimiento: Decimal) -> str | None:
    if cumplimiento >= 100:
        return "ALTO_DESEMPENO"
    elif cumplimiento >= 80:
        return "ESTABLE"
    elif cumplimiento >= 50:
        return "RECUPERACION"
    elif cumplimiento >= 0:
        return "CRITICO"
    return None


def backfill_fecha(fecha: date, dry_run: bool = False) -> dict:
    if not settings.DATABASE_URL:
        raise RuntimeError("DATABASE_URL no está configurada")

    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        # Leer datos desde control_brigadas_diario para la fecha
        rows = conn.execute(text("""
            SELECT
                b.codigo_sap,
                b.usuario,
                b.zona,
                b.tipo_brigada,
                COALESCE(b.corte_en_poste, 0) AS corte_en_poste,
                COALESCE(b.corte_en_empalme, 0) AS corte_en_empalme,
                COALESCE(b.corte_fuera_de_rango, 0) AS corte_fuera_de_rango,
                COALESCE(b.visita_fallida, 0) AS visita_fallida,
                COALESCE(b.reconexiones_ejecutadas, 0) AS reconexiones
            FROM control_brigadas_diario b
            WHERE b.fecha_operacional = :fecha
              AND b.codigo_sap IS NOT NULL AND btrim(b.codigo_sap) <> ''
              AND b.tipo_brigada IN ('PXQ', 'CF')
            ORDER BY b.zona, b.tipo_brigada, b.usuario
        """), {"fecha": fecha})

        brigadas = rows.mappings().all()
        print(f"Registros en control_brigadas_diario para {fecha}: {len(brigadas)}")

        if not brigadas:
            return {"insertados": 0, "errores": ["No hay datos para esta fecha"]}

        # Verificar si ya existen registros en rendimiento_tecnico_diario
        existentes = conn.execute(text("""
            SELECT codigo_sap FROM rendimiento_tecnico_diario
            WHERE fecha_operacional = :fecha
        """), {"fecha": fecha}).scalars().all()
        existentes_set = set(existentes)
        if existentes_set:
            print(f"  Ya existen {len(existentes_set)} registros en rendimiento_tecnico_diario, se omitirán")

        # Leer supervisores mapping
        sup_map_sql = """
            SELECT DISTINCT ON (csus.codigo_sap) csus.codigo_sap, cs.id AS supervisor_id
            FROM control_supervisor_usuarios_sap csus
            JOIN control_supervisores cs ON cs.id = csus.supervisor_id
            WHERE csus.activo IS TRUE
        """
        sup_rows = conn.execute(text(sup_map_sql)).mappings().all()
        sup_map = {r["codigo_sap"]: r["supervisor_id"] for r in sup_rows}

        # Preparar inserts
        inserts = []
        errores = []
        for b in brigadas:
            sap = b["codigo_sap"]
            if sap in existentes_set:
                continue

            if b["tipo_brigada"] not in META_POR_TIPO:
                errores.append(f"{sap}: tipo_brigada {b['tipo_brigada']} sin meta definida")
                continue

            cortes_productivos = b["corte_en_poste"] + b["corte_en_empalme"] + b["corte_fuera_de_rango"]
            meta = META_POR_TIPO[b["tipo_brigada"]]
            cumplimiento = round(Decimal(cortes_productivos) / Decimal(meta) * 100, 2)
            estado = calcular_estado(cumplimiento)
            supervisor_id = sup_map.get(sap)

            inserts.append({
                "fecha_operacional": fecha,
                "codigo_sap": sap,
                "usuario": b["usuario"] or sap,
                "supervisor_id": supervisor_id,
                "zona": b["zona"],
                "tipo_brigada": b["tipo_brigada"],
                "corte_en_poste": b["corte_en_poste"],
                "corte_en_empalme": b["corte_en_empalme"],
                "corte_fuera_de_rango": b["corte_fuera_de_rango"],
                "visita_fallida": b["visita_fallida"],
                "reconexiones": b["reconexiones"],
                "cortes_productivos": cortes_productivos,
                "meta_aplicada": meta,
                "cumplimiento_pct": cumplimiento,
                "es_evaluable": False,
                "estado_diario": None,
                "motivo_no_evaluable": "BACKFILL_HISTORICO",
                "ausencia_id": None,
                "bitacora_id": None,
            })

        if not inserts:
            print("  No hay registros nuevos para insertar")
            return {"insertados": 0, "ya_existian": len(existentes_set), "errores": errores}

        if dry_run:
            print(f"\n  Dry-run: {len(inserts)} registros listos para insertar")
            for ins in inserts[:5]:
                print(f"    {ins['codigo_sap']:>10} {ins['usuario']:<22} {ins['zona']:<14} {ins['tipo_brigada']:<6} "
                      f"cortes={ins['cortes_productivos']:>3} meta={ins['meta_aplicada']:>2} "
                      f"cumpl={ins['cumplimiento_pct']:>6}% estado={ins.get('estado_diario') or 'N/E'}")
            if len(inserts) > 5:
                print(f"    ... y {len(inserts) - 5} más")
        else:
            # Insertar en rendimiento_tecnico_diario
            insert_sql = """
                INSERT INTO rendimiento_tecnico_diario
                    (fecha_operacional, codigo_sap, usuario, supervisor_id, zona, tipo_brigada,
                     corte_en_poste, corte_en_empalme, corte_fuera_de_rango, visita_fallida, reconexiones,
                     cortes_productivos, meta_aplicada, cumplimiento_pct,
                     es_evaluable, estado_diario, motivo_no_evaluable, ausencia_id, bitacora_id)
                VALUES
                    (:fecha_operacional, :codigo_sap, :usuario, :supervisor_id, :zona, :tipo_brigada,
                     :corte_en_poste, :corte_en_empalme, :corte_fuera_de_rango, :visita_fallida, :reconexiones,
                     :cortes_productivos, :meta_aplicada, :cumplimiento_pct,
                     :es_evaluable, :estado_diario, :motivo_no_evaluable, :ausencia_id, :bitacora_id)
                ON CONFLICT (fecha_operacional, codigo_sap) DO NOTHING
            """
            total = 0
            for ins in inserts:
                try:
                    conn.execute(text(insert_sql), ins)
                    total += 1
                except Exception as e:
                    errores.append(f"{ins['codigo_sap']}: {e}")
                    conn.rollback()

            conn.commit()

            # Insertar en rendimiento_tecnico_actual si no existe
            actual_sql = """
                INSERT INTO rendimiento_tecnico_actual
                    (codigo_sap, fase_actual, estado_productivo_actual, dias_consecutivos_bajo_50,
                     dias_consecutivos_alto_desempeno, advertencias_fase2, fecha_ultima_evaluacion)
                VALUES
                    (:codigo_sap, 1, :estado, 0, 0, 0, :fecha)
                ON CONFLICT (codigo_sap) DO NOTHING
            """
            actuales = 0
            for ins in inserts:
                try:
                    conn.execute(text(actual_sql), {
                        "codigo_sap": ins["codigo_sap"],
                        "estado": ins.get("estado_diario") or "SIN_EVALUACION",
                        "fecha": fecha,
                    })
                    actuales += 1
                except Exception as e:
                    errores.append(f"actual {ins['codigo_sap']}: {e}")
                    conn.rollback()

            conn.commit()
            print(f"\n  Insertados: {total} en rendimiento_tecnico_diario, {actuales} en rendimiento_tecnico_actual")

        if errores:
            print(f"  Errores: {len(errores)}")
            for e in errores[:5]:
                print(f"    {e}")

    engine.dispose()
    return {
        "insertados": len([x for x in inserts if x["codigo_sap"] not in existentes_set]) if not dry_run else len(inserts),
        "errores": errores,
    }


def main():
    parser = argparse.ArgumentParser(description="Backfill rendimiento_tecnico_diario")
    parser.add_argument("--fecha", type=str, default="2026-06-23", help="Fecha a backfill (YYYY-MM-DD)")
    parser.add_argument("--dry-run", action="store_true", help="Solo mostrar qué se insertaría")
    args = parser.parse_args()

    try:
        result = backfill_fecha(date.fromisoformat(args.fecha), dry_run=args.dry_run)
    except Exception as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(2) from exc

    if result.get("errores"):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
