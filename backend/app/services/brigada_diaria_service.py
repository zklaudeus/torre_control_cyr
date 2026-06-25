from sqlalchemy.orm import Session
from datetime import date
from typing import List, Dict

from app.schemas.brigada_diaria import BrigadaDiaria, BrigadaDiariaCreate, BrigadaDiariaUpdate, ResumenBrigadasZona
from app.repositories.brigada_diaria_repository import BrigadaDiariaRepository
from app.modules.productividad.sync import (
    eliminar_rendimiento_si_no_hay_brigada,
    sincronizar_rendimiento_desde_brigada,
)
from app.core.brigadas import es_brigada_contabilizable

class BrigadaDiariaService:
    def __init__(self):
        self.repo = BrigadaDiariaRepository()

    def get_by_fecha(self, db: Session, fecha: date) -> List[BrigadaDiaria]:
        return self.repo.get_by_fecha(db, fecha)

    def create(self, db: Session, item: BrigadaDiariaCreate) -> BrigadaDiaria:
        self._validate_brigada(item)
        brigada = self.repo.create(db, item)
        sincronizar_rendimiento_desde_brigada(db, brigada)
        db.commit()
        db.refresh(brigada)
        return brigada

    def update(self, db: Session, id: int, item: BrigadaDiariaUpdate) -> BrigadaDiaria:
        self._validate_brigada(item)
        db_item = self.repo.get_by_id(db, id)
        if not db_item:
            return None
        brigada = self.repo.update(db, db_item, item)
        sincronizar_rendimiento_desde_brigada(db, brigada)
        db.commit()
        db.refresh(brigada)
        return brigada

    def delete(self, db: Session, id: int) -> bool:
        db_item = self.repo.get_by_id(db, id)
        if not db_item:
            return False
        fecha_operacional = db_item.fecha_operacional
        codigo_sap = db_item.codigo_sap
        self.repo.delete(db, db_item)
        eliminar_rendimiento_si_no_hay_brigada(db, fecha_operacional, codigo_sap)
        db.commit()
        return True

    def get_resumen_by_fecha(self, db: Session, fecha: date) -> List[ResumenBrigadasZona]:
        brigadas = self.repo.get_by_fecha(db, fecha)
        
        # Agrupar por zona
        resumen_dict: Dict[str, ResumenBrigadasZona] = {}
        
        for b in brigadas:
            zona = b.zona
            if zona not in resumen_dict:
                resumen_dict[zona] = ResumenBrigadasZona(
                    zona=zona,
                    brigadas_pxq=0,
                    brigadas_cf=0,
                    total_brigadas_reportadas=0,
                    brigadas_operativas=0,
                    brigadas_inactivas=0,
                    observacion_automatica=""
                )

            res = resumen_dict[zona]
            # Toda brigada registrada ese día suma al total reportado
            # (visible en la bitácora para auditoría).
            res.total_brigadas_reportadas += 1

            if not es_brigada_contabilizable(b):
                # Inactiva: se registra en el contador pero no aporta
                # a cortes, reconexiones ni al desglose por tipo.
                res.brigadas_inactivas += 1
                continue

            # Operativa: aporta a todos los indicadores
            res.brigadas_operativas += 1
            if b.tipo_brigada == "PXQ":
                res.brigadas_pxq += 1
            elif b.tipo_brigada == "CF":
                res.brigadas_cf += 1
                
        # Construir la observación automática
        for zona, res in resumen_dict.items():
            if res.brigadas_inactivas > 0:
                res.observacion_automatica = (
                    f"{res.brigadas_inactivas} brigada(s) inactiva(s) excluida(s) de indicadores"
                )
            else:
                res.observacion_automatica = "Todas operativas"
                
        return list(resumen_dict.values())

    def _validate_brigada(self, item):
        from fastapi import HTTPException
        if item.tipo_brigada not in ["PXQ", "CF"]:
            raise HTTPException(status_code=400, detail="tipo_brigada debe ser PXQ o CF")
        if item.estado_brigada not in ["Operativa", "Inactiva"]:
            raise HTTPException(status_code=400, detail="estado_brigada debe ser Operativa o Inactiva")
        if item.estado_brigada == "Inactiva":
            return
