from sqlalchemy.orm import Session
from typing import List
from app.models.cyr_models import ControlParametrosZona

class ParametroZonaRepository:
    def get_zonas_activas(self, db: Session) -> List[ControlParametrosZona]:
        return db.query(ControlParametrosZona).filter(ControlParametrosZona.activo == True).all()
