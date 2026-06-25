from sqlalchemy.orm import Session
from datetime import date
from typing import List

from app.schemas.programacion_zona import ProgramacionZona, ProgramacionZonaBase, ProgramacionZonaBulkCreate
from app.repositories.programacion_zona_repository import ProgramacionZonaRepository
from app.repositories.parametro_zona_repository import ParametroZonaRepository

class ProgramacionZonaService:
    def __init__(self):
        self.prog_repo = ProgramacionZonaRepository()
        self.param_repo = ParametroZonaRepository()

    def get_programacion_por_fecha(self, db: Session, fecha: date) -> List[ProgramacionZona]:
        # Traer zonas activas
        zonas_activas = self.param_repo.get_zonas_activas(db)
        nombres_zonas = sorted(list(set(z.zona for z in zonas_activas)))
        
        # Traer la programación existente
        programacion_existente = self.prog_repo.get_by_fecha(db, fecha)
        prog_dict = {(p.zona, p.tipo_brigada): p for p in programacion_existente}
        
        resultado = []
        for nombre_zona in nombres_zonas:
            for tipo in ["PXQ", "CF"]:
                clave = (nombre_zona, tipo)
                if clave in prog_dict:
                    existente = prog_dict[clave]
                    resultado.append(ProgramacionZona(
                        id=existente.id,
                        fecha_operacional=existente.fecha_operacional,
                        zona=existente.zona,
                        tipo_brigada=existente.tipo_brigada,
                        reconexiones_programadas=existente.reconexiones_programadas,
                        asignacion_carga=existente.asignacion_carga,
                        corte_programado=existente.corte_programado
                    ))
                else:
                    # Retornar ceros
                    resultado.append(ProgramacionZona(
                        id=None,
                        fecha_operacional=fecha,
                        zona=nombre_zona,
                        tipo_brigada=tipo,
                        reconexiones_programadas=0,
                        asignacion_carga=0,
                        corte_programado=0
                    ))
        return resultado

    def bulk_create_or_update(self, db: Session, bulk_data: ProgramacionZonaBulkCreate) -> List[ProgramacionZona]:
        resultado = []
        for item in bulk_data.items:
            db_item = self.prog_repo.create_or_update(db, bulk_data.fecha_operacional, item)
            resultado.append(ProgramacionZona(
                id=db_item.id,
                fecha_operacional=db_item.fecha_operacional,
                zona=db_item.zona,
                tipo_brigada=db_item.tipo_brigada,
                reconexiones_programadas=db_item.reconexiones_programadas,
                asignacion_carga=db_item.asignacion_carga,
                corte_programado=db_item.corte_programado
            ))
        return resultado
