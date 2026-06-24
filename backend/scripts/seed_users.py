import os
import sys
import json
from pathlib import Path

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.cyr_models import Base, ControlUsuarios
from app.core.security import get_password_hash

SECRETS_FILE = Path(BACKEND_DIR).parent / ".secrets" / "seed_passwords.json"

def load_seed_passwords() -> dict:
    if not SECRETS_FILE.exists():
        print(f"ERROR: No se encuentra {SECRETS_FILE}")
        print("Ejecuta primero: python backend/scripts/generate_seed_passwords.py")
        sys.exit(1)
    with open(SECRETS_FILE) as f:
        return json.load(f)

def seed_users():
    print("Creando tablas si no existen...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    seed_passwords = load_seed_passwords()

    users = [
        {"usuario": "admin", "rol": "admin", "supervisor_id": None},
        {"usuario": "claudio", "rol": "torre_control", "supervisor_id": None},
        {"usuario": "juan.munoz", "rol": "supervisor", "supervisor_id": 1},
        {"usuario": "jose.masso", "rol": "supervisor", "supervisor_id": 3},
        {"usuario": "nicolas.farias", "rol": "supervisor", "supervisor_id": 5},
        {"usuario": "eduardo.beltran", "rol": "supervisor", "supervisor_id": 4},
        {"usuario": "cynthia.garrido", "rol": "supervisor", "supervisor_id": 6},
        {"usuario": "gerencia", "rol": "gerencia", "supervisor_id": None},
    ]

    try:
        for u in users:
            existing_user = db.query(ControlUsuarios).filter(ControlUsuarios.usuario == u["usuario"]).first()
            if not existing_user:
                password_plain = seed_passwords.get(u["usuario"])
                if not password_plain:
                    print(f"  [SKIP] {u['usuario']}: sin contraseña en {SECRETS_FILE}")
                    continue
                new_user = ControlUsuarios(
                    usuario=u["usuario"],
                    password_hash=get_password_hash(password_plain),
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
