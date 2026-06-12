import os
import sys

# Ajustar PYTHONPATH para que reconozca el paquete 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine, Base
from app.models.cyr_models import ControlProgramacionZona, DimTipoBrigadaUsuario

def migrate_tipo_brigada():
    print("Iniciando migración para tipo_brigada...")
    
    with engine.begin() as conn:
        # 1. Add tipo_brigada to control_programacion_zona
        print("Modificando control_programacion_zona...")
        conn.execute(text("ALTER TABLE control_programacion_zona ADD COLUMN IF NOT EXISTS tipo_brigada VARCHAR(50) NOT NULL DEFAULT 'PXQ';"))
        
        # Drop old constraint and add new one
        conn.execute(text("ALTER TABLE control_programacion_zona DROP CONSTRAINT IF EXISTS uq_programacion_fecha_zona CASCADE;"))
        conn.execute(text("ALTER TABLE control_programacion_zona DROP CONSTRAINT IF EXISTS uq_programacion_fecha_zona_tipo CASCADE;"))
        conn.execute(text("ALTER TABLE control_programacion_zona ADD CONSTRAINT uq_programacion_fecha_zona_tipo UNIQUE(fecha_operacional, zona, tipo_brigada);"))
        
        conn.execute(text("DROP INDEX IF EXISTS idx_programacion_zona_fecha_zona CASCADE;"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_programacion_zona_fecha_zona_tipo ON control_programacion_zona(fecha_operacional, zona, tipo_brigada);"))
        
        # 1.5. Add Check constraint for control_brigadas_diario
        print("Agregando restricción CHECK a control_brigadas_diario...")
        conn.execute(text("ALTER TABLE control_brigadas_diario DROP CONSTRAINT IF EXISTS chk_tipo_brigada;"))
        conn.execute(text("ALTER TABLE control_brigadas_diario ADD CONSTRAINT chk_tipo_brigada CHECK (tipo_brigada IN ('PXQ', 'CF'));"))
        
        # 2. Add tipo_brigada to control_parametros_zona
        print("Modificando control_parametros_zona...")
        conn.execute(text("ALTER TABLE control_parametros_zona ADD COLUMN IF NOT EXISTS tipo_brigada VARCHAR(50) NOT NULL DEFAULT 'PXQ';"))
        
        conn.execute(text("ALTER TABLE control_parametros_zona DROP CONSTRAINT IF EXISTS control_parametros_zona_zona_key CASCADE;"))
        conn.execute(text("ALTER TABLE control_parametros_zona DROP CONSTRAINT IF EXISTS uq_parametros_zona_tipo CASCADE;"))
        conn.execute(text("ALTER TABLE control_parametros_zona ADD CONSTRAINT uq_parametros_zona_tipo UNIQUE(zona, tipo_brigada);"))
        
        conn.execute(text("ALTER TABLE control_parametros_zona DROP CONSTRAINT IF EXISTS chk_param_tipo_brigada;"))
        conn.execute(text("ALTER TABLE control_parametros_zona ADD CONSTRAINT chk_param_tipo_brigada CHECK (tipo_brigada IN ('PXQ', 'CF'));"))
        
        # 3. Create dim_tipo_brigada_usuario
        print("Creando dim_tipo_brigada_usuario...")
        DimTipoBrigadaUsuario.__table__.create(engine, checkfirst=True)
        
        # 4. Populate initial data for CF users
        print("Poblando dim_tipo_brigada_usuario...")
        usuarios_cf = [
            'Hector Huerta', 'Mauricio Veliz', 'Lexter Jorquera', 
            'Rafael Sevilla', 'Alexis Sepulveda', 'Bryan Rojas', 'Benjamin Medina'
        ]
        
        for user in usuarios_cf:
            conn.execute(
                text("INSERT INTO dim_tipo_brigada_usuario (usuario_normalizado, tipo_brigada, activo) VALUES (:u, 'CF', true) ON CONFLICT (usuario_normalizado) DO NOTHING;"),
                {"u": user}
            )
            
        print("Migración completada exitosamente.")

if __name__ == "__main__":
    migrate_tipo_brigada()
