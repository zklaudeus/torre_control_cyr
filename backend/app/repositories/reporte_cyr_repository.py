from sqlalchemy.orm import Session
from app.models.cyr_models import ReporteCYR
from datetime import date
from typing import List, Optional

class ReporteCYRRepository:
    def get_by_fecha(self, db: Session, fecha: date) -> Optional[ReporteCYR]:
        return db.query(ReporteCYR).filter(ReporteCYR.fecha_operacional == fecha).first()

    def get_all(self, db: Session, limit: int = 100) -> List[ReporteCYR]:
        return db.query(ReporteCYR).order_by(ReporteCYR.fecha_operacional.desc()).limit(limit).all()

    def create(self, db: Session, fecha: date) -> ReporteCYR:
        db_reporte = ReporteCYR(fecha_operacional=fecha, estado="borrador")
        db.add(db_reporte)
        db.commit()
        db.refresh(db_reporte)
        return db_reporte
