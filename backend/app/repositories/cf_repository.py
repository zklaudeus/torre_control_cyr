from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.models.cyr_models import ControlParametrosCFGenerales, ControlParametrosCFZona, ControlProgramacionCFZona
from app.schemas.parametros_cf import ParametrosCFGeneralesBase, ParametrosCFZonaBase
from app.schemas.programacion_cf_zona import ProgramacionCFZonaBase

class ParametrosCFRepository:
    def get_generales(self, db: Session) -> Optional[ControlParametrosCFGenerales]:
        return db.query(ControlParametrosCFGenerales).first()

    def get_zonas_activas(self, db: Session) -> List[ControlParametrosCFZona]:
        return db.query(ControlParametrosCFZona).filter(ControlParametrosCFZona.activo == True).order_by(ControlParametrosCFZona.zona).all()

class ProgramacionCFZonaRepository:
    def get_by_fecha(self, db: Session, fecha: date) -> List[ControlProgramacionCFZona]:
        return db.query(ControlProgramacionCFZona).filter(ControlProgramacionCFZona.fecha_operacional == fecha).all()

    def create_or_update(self, db: Session, fecha: date, item_data: ProgramacionCFZonaBase) -> ControlProgramacionCFZona:
        existing = db.query(ControlProgramacionCFZona).filter_by(
            fecha_operacional=fecha, zona=item_data.zona
        ).first()

        if existing:
            for key, value in item_data.model_dump().items():
                setattr(existing, key, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            new_item = ControlProgramacionCFZona(fecha_operacional=fecha, **item_data.model_dump())
            db.add(new_item)
            db.commit()
            db.refresh(new_item)
            return new_item
