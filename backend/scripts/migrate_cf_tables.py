import os
import sys

# Ajustar PYTHONPATH para que reconozca el paquete 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine, Base
from app.models.cyr_models import ControlParametrosCFGenerales, ControlParametrosCFZona, ControlProgramacionCFZona

def migrate_cf():
    print("Creando tablas CF si no existen...")
    # Esto creará las nuevas tablas definidas en los modelos
    ControlParametrosCFGenerales.__table__.create(engine, checkfirst=True)
    ControlParametrosCFZona.__table__.create(engine, checkfirst=True)
    ControlProgramacionCFZona.__table__.create(engine, checkfirst=True)

    # Insertar valores iniciales para CF Zona si la tabla está vacía
    with engine.begin() as conn:
        print("Poblando ControlParametrosCFZona...")
        # Check if empty
        result = conn.execute(text("SELECT COUNT(*) FROM control_parametros_cf_zona"))
        count = result.scalar()
        if count == 0:
            zonas = [
                {'zona': 'Iquique', 'brigadas': 0},
                {'zona': 'Coquimbo', 'brigadas': 4},
                {'zona': 'Santa Cruz', 'brigadas': 0},
                {'zona': 'Talca', 'brigadas': 3},
                {'zona': 'Concepción', 'brigadas': 0},
            ]
            for z in zonas:
                conn.execute(
                    text("INSERT INTO control_parametros_cf_zona (zona, brigadas_cf_contrato, activo) VALUES (:z, :b, true)"),
                    {"z": z['zona'], "b": z['brigadas']}
                )
            print("Datos de zonas insertados.")
        else:
            print("ControlParametrosCFZona ya tiene datos.")

        print("Poblando ControlParametrosCFGenerales...")
        result_gen = conn.execute(text("SELECT COUNT(*) FROM control_parametros_cf_generales"))
        count_gen = result_gen.scalar()
        if count_gen == 0:
            conn.execute(
                text("""
                    INSERT INTO control_parametros_cf_generales 
                    (meta_diaria_cortes_brigada, hora_inicio_jornada, hora_cierre_jornada, 
                     meta_acumulada_09, meta_acumulada_10, meta_acumulada_11, 
                     meta_acumulada_12, meta_acumulada_13, meta_acumulada_14, 
                     umbral_semaforo_logrado, umbral_semaforo_mejora, activo) 
                    VALUES 
                    (6, '08:00', '14:00', 1, 1, 1, 1, 1, 1, 30, 20, true)
                """)
            )
            print("Datos generales CF insertados.")
        else:
            print("ControlParametrosCFGenerales ya tiene datos.")

    print("Migración de CF completada exitosamente.")

if __name__ == "__main__":
    migrate_cf()
