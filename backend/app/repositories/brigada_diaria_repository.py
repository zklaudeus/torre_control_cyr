from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from app.models.cyr_models import ControlBrigadasDiario
from app.schemas.brigada_diaria import BrigadaDiariaCreate, BrigadaDiariaUpdate

class BrigadaDiariaRepository:
    def get_by_fecha(self, db: Session, fecha: date) -> List[ControlBrigadasDiario]:
        return db.query(ControlBrigadasDiario).filter(
            ControlBrigadasDiario.fecha_operacional == fecha
        ).order_by(
            ControlBrigadasDiario.zona, ControlBrigadasDiario.usuario
        ).all()

    def get_by_id(self, db: Session, id: int) -> Optional[ControlBrigadasDiario]:
        return db.query(ControlBrigadasDiario).filter(ControlBrigadasDiario.id == id).first()

    def create(self, db: Session, item: BrigadaDiariaCreate) -> ControlBrigadasDiario:
        db_item = ControlBrigadasDiario(
            fecha_operacional=item.fecha_operacional,
            zona=item.zona,
            codigo_sap=item.codigo_sap,
            patente=item.patente,
            usuario=item.usuario,
            tipo_brigada=item.tipo_brigada,
            estado_brigada=item.estado_brigada,
            hora_primer_movimiento=item.hora_primer_movimiento,
            observacion_brigada=item.observacion_brigada
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    def update(self, db: Session, db_item: ControlBrigadasDiario, item: BrigadaDiariaUpdate) -> ControlBrigadasDiario:
        db_item.zona = item.zona
        db_item.codigo_sap = item.codigo_sap
        db_item.patente = item.patente
        db_item.usuario = item.usuario
        db_item.tipo_brigada = item.tipo_brigada
        db_item.estado_brigada = item.estado_brigada
        db_item.hora_primer_movimiento = item.hora_primer_movimiento
        db_item.observacion_brigada = item.observacion_brigada
        db.commit()
        db.refresh(db_item)
        return db_item

    def delete(self, db: Session, db_item: ControlBrigadasDiario):
        db.delete(db_item)
        db.commit()
