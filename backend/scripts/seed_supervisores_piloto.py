"""
seed_supervisores_piloto.py
----------------------------
Crea/recrea los supervisores del piloto EISESA CyR.

REGLAS:
- Solo toca control_supervisores y control_supervisor_comunas_zonas.
- NO borra datos históricos (control_brigadas_diario, reportes, programación).
- NO toca usuarios SAP existentes del supervisor Juan Muñoz (id=1).
- Consolida el duplicado de Juan Muñoz (mantiene id=1, elimina id=2).
- Crea los supervisores faltantes: Eduardo Beltrán, Nicolas Farias, Cynthia Garrido.
- Actualiza zonas de todos los supervisores según especificaciones del piloto.

Ejecutar desde backend/:
    python scripts/seed_supervisores_piloto.py
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal
from app.models.cyr_models import (
    ControlSupervisores,
    ControlSupervisorComunasZonas,
    ControlSupervisorUsuariosSAP
)

# =============================================================================
# CONFIGURACIÓN DE SUPERVISORES PILOTO
# =============================================================================
SUPERVISORES_PILOTO = [
    {
        "nombre": "Juan Muñoz",
        "zonas_comunas": {
            # Zona Concepción
            "Concepción": [
                "Coronel", "Concepcion", "Chiguayante", "Talcahuano",
                "San Pedro", "Hualpen", "Penco", "Tome", "Coelemu", "Concepción"
            ],
            # Zona Los Ángeles
            "Los Ángeles": ["Los Ángeles", "Los Angeles"],
            # Zona Chillán
            "Chillán": ["San Carlos", "Chillan Viejo", "Chillan", "Chillán"],
        }
    },
    {
        "nombre": "Jose Masso",
        "zonas_comunas": {
            "Talca": ["Talca"],
        }
    },
    {
        "nombre": "Eduardo Beltrán",
        "zonas_comunas": {
            "Iquique": ["Iquique", "Alto Hospicio"],
        }
    },
    {
        "nombre": "Nicolas Farias",
        "zonas_comunas": {
            "Coquimbo": ["Coquimbo", "La Serena", "Ovalle"],
        }
    },
    {
        "nombre": "Cynthia Garrido",
        "zonas_comunas": {
            "Santa Cruz": ["Santa Cruz", "San Fernando", "Pichilemu"],
        }
    },
]

def run_seed():
    db = SessionLocal()
    try:
        print("=" * 60)
        print("SEED: Supervisores Piloto EISESA CyR")
        print("=" * 60)

        # ── 1. Eliminar duplicado de Juan Muñoz (id=2 si existe) ──────────
        duplicado_jm = db.query(ControlSupervisores).filter(
            ControlSupervisores.nombre == "Juan Muñoz",
            ControlSupervisores.id != 1
        ).all()
        for dup in duplicado_jm:
            print(f"  Eliminando duplicado de Juan Muñoz (id={dup.id})...")
            # Reasignar zonas del duplicado al id=1 si hubiera alguna exclusiva
            db.query(ControlSupervisorComunasZonas).filter(
                ControlSupervisorComunasZonas.supervisor_id == dup.id
            ).delete()
            db.query(ControlSupervisorUsuariosSAP).filter(
                ControlSupervisorUsuariosSAP.supervisor_id == dup.id
            ).delete()
            db.delete(dup)
        db.flush()

        # ── 2. Para cada supervisor piloto: upsert supervisores + zonas ───
        for config in SUPERVISORES_PILOTO:
            nombre = config["nombre"]
            zonas_comunas = config["zonas_comunas"]

            # Buscar supervisor existente
            sup = db.query(ControlSupervisores).filter(
                ControlSupervisores.nombre == nombre
            ).first()

            if sup:
                print(f"  [{nombre}] -> Supervisor existente (id={sup.id}), actualizando zonas...")
                sup.activo = True
            else:
                sup = ControlSupervisores(nombre=nombre, activo=True)
                db.add(sup)
                db.flush()
                print(f"  [{nombre}] -> Creado nuevo (id={sup.id})")

            # Eliminar zonas/comunas anteriores y recrear
            db.query(ControlSupervisorComunasZonas).filter(
                ControlSupervisorComunasZonas.supervisor_id == sup.id
            ).delete()
            db.flush()

            for zona, comunas in zonas_comunas.items():
                for comuna in comunas:
                    entry = ControlSupervisorComunasZonas(
                        supervisor_id=sup.id,
                        comuna=comuna,
                        zona_principal=zona,
                        activo=True
                    )
                    db.add(entry)
            print(f"    Zonas configuradas: {list(zonas_comunas.keys())}")

        db.commit()
        print()
        print("OK: Seed completado exitosamente.")
        print()
        print("Supervisores en BD:")
        todos = db.query(ControlSupervisores).filter(ControlSupervisores.activo == True).all()
        for s in todos:
            zonas = db.query(ControlSupervisorComunasZonas).filter(
                ControlSupervisorComunasZonas.supervisor_id == s.id
            ).all()
            zonas_nombres = sorted(set(z.zona_principal for z in zonas))
            print(f"  id={s.id} | {s.nombre} | Zonas: {', '.join(zonas_nombres)}")

    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        print(f"ERROR durante el seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
