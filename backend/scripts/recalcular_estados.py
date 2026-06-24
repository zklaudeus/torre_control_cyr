"""Recalcula estado_productivo_actual para todos los técnicos.

Usa la nueva lógica basada en cortes_productivos según tipo_brigada:
  PXQ: 0-12=CRITICO, 13-24=RECUPERACION, >=25=ESTABLE,
       >=25 por 3 días evaluables consecutivos=ALTO_DESEMPENO
  CF:  0-2=CRITICO, 3-5=RECUPERACION, >=6=ESTABLE,
       >=6 por 3 días evaluables consecutivos=ALTO_DESEMPENO

Uso:
    python scripts/recalcular_estados.py                         # todos los técnicos
    python scripts/recalcular_estados.py --sap 123456            # solo uno
    python scripts/recalcular_estados.py --dry-run               # modo simulación
"""

from __future__ import annotations
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.modules.productividad.repository import ProductividadRepository
from app.models.domain_models import DimSap


def main():
    parser = argparse.ArgumentParser(description="Recalcula estados productivos")
    parser.add_argument("--sap", type=str, help="Solo un técnico (codigo_sap)")
    parser.add_argument("--dry-run", action="store_true", help="Solo mostrar sin guardar")
    args = parser.parse_args()

    engine = create_engine(settings.DATABASE_URL)
    repo = ProductividadRepository()

    with Session(engine) as db:
        q = db.query(DimSap).filter(DimSap.activo == True)
        if args.sap:
            q = q.filter(DimSap.codigo_sap == args.sap)
        tecnicos = q.all()

        if not tecnicos:
            print("No se encontraron técnicos activos.")
            sys.exit(0)

        print(f"Procesando {len(tecnicos)} técnicos...")
        ok = 0
        sin_datos = 0
        for t in tecnicos:
            print(f"  {t.codigo_sap} ({t.cuenta or '?'}) [{t.tipo_brigada}]", end="")
            if args.dry_run:
                # Simular: mostrar resultado sin guardar
                ultimo = db.execute(
                    text("""
                        SELECT cortes_productivos, fecha_operacional
                        FROM rendimiento_tecnico_diario
                        WHERE codigo_sap = :s AND es_evaluable = TRUE
                        ORDER BY fecha_operacional DESC LIMIT 1
                    """),
                    {"s": t.codigo_sap},
                ).first()
                if not ultimo:
                    print("  -> SIN_DATOS_EVALUABLES (no cambia)")
                    sin_datos += 1
                else:
                    print(f"  -> cortes={ultimo[0]}, fecha={ultimo[1]}")
                    ok += 1
            else:
                result = repo.actualizar_estado_tecnico(db, t.codigo_sap)
                if result["actualizado"]:
                    prev = result.get("estado_anterior") or "-"
                    print(f"  {prev} -> {result['estado_nuevo']}")
                    ok += 1
                else:
                    print(f"  -> {result['mensaje']}")
                    sin_datos += 1

        print(f"\nHecho: {ok} actualizados, {sin_datos} sin datos evaluables")


if __name__ == "__main__":
    main()
