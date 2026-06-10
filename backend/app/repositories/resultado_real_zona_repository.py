from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.models.cyr_models import ControlResultadosRealesZona
from app.schemas.resultado_real_zona import ResultadoRealZonaBase


class ResultadoRealZonaRepository:
    def get_by_fecha(self, db: Session, fecha: date) -> List[ControlResultadosRealesZona]:
        return db.query(ControlResultadosRealesZona).filter(
            ControlResultadosRealesZona.fecha_operacional == fecha
        ).all()

    def get_by_fecha_and_zona(self, db: Session, fecha: date, zona: str) -> Optional[ControlResultadosRealesZona]:
        return db.query(ControlResultadosRealesZona).filter(
            ControlResultadosRealesZona.fecha_operacional == fecha,
            ControlResultadosRealesZona.zona == zona
        ).first()

    def create_or_update(self, db: Session, fecha: date, item: ResultadoRealZonaBase) -> ControlResultadosRealesZona:
        existing = self.get_by_fecha_and_zona(db, fecha, item.zona)
        if existing:
            existing.total_reconexiones_ejecutadas = item.total_reconexiones_ejecutadas
            existing.total_cortes = item.total_cortes
            existing.corte_en_poste = item.corte_en_poste
            existing.corte_en_empalme = item.corte_en_empalme
            existing.visita_fallida = item.visita_fallida
            db_item = existing
        else:
            db_item = ControlResultadosRealesZona(
                fecha_operacional=fecha,
                zona=item.zona,
                total_reconexiones_ejecutadas=item.total_reconexiones_ejecutadas,
                total_cortes=item.total_cortes,
                corte_en_poste=item.corte_en_poste,
                corte_en_empalme=item.corte_en_empalme,
                visita_fallida=item.visita_fallida
            )
            db.add(db_item)

        db.commit()
        db.refresh(db_item)
        return db_item
