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
            observacion_brigada=item.observacion_brigada,
            # Nuevos campos (Ajuste 5.1)
            reconexiones_ejecutadas=item.reconexiones_ejecutadas,
            primer_corte=item.primer_corte,
            ultimo_corte=item.ultimo_corte,
            acum_09=item.acum_09,
            acum_10=item.acum_10,
            acum_11=item.acum_11,
            acum_12=item.acum_12,
            acum_13=item.acum_13,
            acum_14=item.acum_14,
            corte_en_poste=item.corte_en_poste,
            corte_en_empalme=item.corte_en_empalme,
            visita_fallida=item.visita_fallida,
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    def update(self, db: Session, db_item: ControlBrigadasDiario, item: BrigadaDiariaUpdate) -> ControlBrigadasDiario:
        # Only update fields that are explicitly provided (not None)
        for field, value in item.model_dump(exclude_none=True).items():
            setattr(db_item, field, value)
        db.commit()
        db.refresh(db_item)
        return db_item

    def delete(self, db: Session, db_item: ControlBrigadasDiario):
        db.delete(db_item)
        db.commit()
