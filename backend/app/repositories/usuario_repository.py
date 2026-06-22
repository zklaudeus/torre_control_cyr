from sqlalchemy.orm import Session
from app.models.cyr_models import ControlUsuarios

def get_user_by_username(db: Session, username: str):
    return db.query(ControlUsuarios).filter(ControlUsuarios.usuario == username).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(ControlUsuarios).filter(ControlUsuarios.id == user_id).first()
