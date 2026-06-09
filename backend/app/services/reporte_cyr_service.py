from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from app.repositories.reporte_cyr_repository import ReporteCYRRepository
from app.models.cyr_models import ReporteCYR

class ReporteCYRService:
    def __init__(self):
        self.repository = ReporteCYRRepository()

    def get_or_create_reporte(self, db: Session, fecha: date) -> ReporteCYR:
        existing = self.repository.get_by_fecha(db, fecha)
        if existing:
            return existing
        return self.repository.create(db, fecha)

    def get_reporte_by_fecha(self, db: Session, fecha: date) -> Optional[ReporteCYR]:
        return self.repository.get_by_fecha(db, fecha)

    def get_all_reportes(self, db: Session, limit: int = 100) -> List[ReporteCYR]:
        return self.repository.get_all(db, limit)
