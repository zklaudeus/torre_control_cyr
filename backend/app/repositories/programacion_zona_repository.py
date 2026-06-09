from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from app.models.cyr_models import ControlProgramacionZona
from app.schemas.programacion_zona import ProgramacionZonaBase

class ProgramacionZonaRepository:
    def get_by_fecha(self, db: Session, fecha: date) -> List[ControlProgramacionZona]:
        return db.query(ControlProgramacionZona).filter(ControlProgramacionZona.fecha_operacional == fecha).all()

    def get_by_fecha_and_zona(self, db: Session, fecha: date, zona: str) -> Optional[ControlProgramacionZona]:
        return db.query(ControlProgramacionZona).filter(
            ControlProgramacionZona.fecha_operacional == fecha,
            ControlProgramacionZona.zona == zona
        ).first()

    def create_or_update(self, db: Session, fecha: date, item: ProgramacionZonaBase) -> ControlProgramacionZona:
        existing = self.get_by_fecha_and_zona(db, fecha, item.zona)
        if existing:
            existing.reconexiones_programadas = item.reconexiones_programadas
            existing.asignacion_carga = item.asignacion_carga
            existing.corte_programado = item.corte_programado
            db_item = existing
        else:
            db_item = ControlProgramacionZona(
                fecha_operacional=fecha,
                zona=item.zona,
                reconexiones_programadas=item.reconexiones_programadas,
                asignacion_carga=item.asignacion_carga,
                corte_programado=item.corte_programado
            )
            db.add(db_item)
        
        db.commit()
        db.refresh(db_item)
        return db_item
