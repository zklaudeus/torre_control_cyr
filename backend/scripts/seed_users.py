import os
import sys

# Agregar la ruta base del proyecto para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.cyr_models import Base, ControlUsuarios
from app.core.security import get_password_hash

def seed_users():
    print("Creando tablas si no existen...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    users = [
        {"usuario": "admin", "password_plain": "admin123", "rol": "admin", "supervisor_id": None},
        {"usuario": "claudio", "password_plain": "admin123", "rol": "torre_control", "supervisor_id": None},
        {"usuario": "juan.munoz", "password_plain": "admin123", "rol": "supervisor", "supervisor_id": 1},
        {"usuario": "jose.masso", "password_plain": "admin123", "rol": "supervisor", "supervisor_id": 3},
        {"usuario": "nicolas.farias", "password_plain": "admin123", "rol": "supervisor", "supervisor_id": 5},
        {"usuario": "eduardo.beltran", "password_plain": "admin123", "rol": "supervisor", "supervisor_id": 4},
        {"usuario": "cynthia.garrido", "password_plain": "admin123", "rol": "supervisor", "supervisor_id": 6},
    ]

    try:
        for u in users:
            existing_user = db.query(ControlUsuarios).filter(ControlUsuarios.usuario == u["usuario"]).first()
            if not existing_user:
                new_user = ControlUsuarios(
                    usuario=u["usuario"],
                    password_hash=get_password_hash(u["password_plain"]),
                    rol=u["rol"],
                    supervisor_id=u["supervisor_id"],
                    activo=True
                )
                db.add(new_user)
                print(f"Usuario {u['usuario']} creado.")
            else:
                print(f"Usuario {u['usuario']} ya existe.")
        db.commit()
        print("Seed completado.")
    except Exception as e:
        db.rollback()
        print(f"Error en seed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
