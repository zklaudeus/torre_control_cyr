from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import List

from app.schemas.parametros_cf import ParametrosCFResponse, ParametrosCFGenerales, ParametrosCFZona
from app.schemas.programacion_cf_zona import ProgramacionCFZonaBulkCreate, ProgramacionCFZona, ProgramacionCFZonaResponse, ProgramacionCFZonaBase
from app.schemas.resultados_reales_cf import ResultadosRealesCFZonaResponse, ResultadoRealCFZonaCalculado
from app.repositories.cf_repository import ParametrosCFRepository, ProgramacionCFZonaRepository
from app.models.cyr_models import ControlBrigadasDiario

class CFService:
    def __init__(self):
        self.param_repo = ParametrosCFRepository()
        self.prog_repo = ProgramacionCFZonaRepository()

    def get_parametros(self, db: Session) -> ParametrosCFResponse:
        gen = self.param_repo.get_generales(db)
        zonas = self.param_repo.get_zonas_activas(db)
        
        gen_schema = ParametrosCFGenerales.model_validate(gen) if gen else None
        zonas_schema = [ParametrosCFZona.model_validate(z) for z in zonas]
        
        return ParametrosCFResponse(generales=gen_schema, zonas=zonas_schema)

    def get_programacion_por_fecha(self, db: Session, fecha: date) -> ProgramacionCFZonaResponse:
        zonas_activas = self.param_repo.get_zonas_activas(db)
        existentes = self.prog_repo.get_by_fecha(db, fecha)
        existentes_dict = {r.zona: r for r in existentes}

        resultado: List[ProgramacionCFZona] = []
        for zona in zonas_activas:
            if zona.zona in existentes_dict:
                r = existentes_dict[zona.zona]
                resultado.append(ProgramacionCFZona.model_validate(r))
            else:
                resultado.append(ProgramacionCFZona(
                    id=None,
                    fecha_operacional=fecha,
                    zona=zona.zona,
                    reconexiones_programadas=0,
                    total_reconexiones_ejecutadas=0,
                    cortes_programados=0
                ))
        return ProgramacionCFZonaResponse(fecha_operacional=str(fecha), zonas=resultado)

    def bulk_create_or_update_programacion(self, db: Session, bulk_data: ProgramacionCFZonaBulkCreate) -> ProgramacionCFZonaResponse:
        for item in bulk_data.items:
            self.prog_repo.create_or_update(db, bulk_data.fecha_operacional, item)
        return self.get_programacion_por_fecha(db, bulk_data.fecha_operacional)

    def calcular_resultados_reales_cf(self, db: Session, fecha: date) -> ResultadosRealesCFZonaResponse:
        alertas: List[str] = []
        zonas_activas = self.param_repo.get_zonas_activas(db)
        
        if not zonas_activas:
            alertas.append("No hay zonas CF activas configuradas.")

        # Aggregation from control_brigadas_diario filtering by tipo_brigada == 'CF'
        rows = (
            db.query(
                ControlBrigadasDiario.zona,
                func.sum(
                    func.coalesce(ControlBrigadasDiario.corte_en_poste, 0) +
                    func.coalesce(ControlBrigadasDiario.corte_en_empalme, 0)
                ).label("total_cortes_cf"),
                func.sum(func.coalesce(ControlBrigadasDiario.corte_en_poste, 0)).label("corte_en_poste_cf"),
                func.sum(func.coalesce(ControlBrigadasDiario.corte_en_empalme, 0)).label("corte_en_empalme_cf"),
                func.sum(func.coalesce(ControlBrigadasDiario.visita_fallida, 0)).label("visita_fallida_cf"),
                func.min(ControlBrigadasDiario.primer_corte).label("primer_corte_cf"),
                func.max(ControlBrigadasDiario.ultimo_corte).label("ultimo_corte_cf"),
                func.sum(func.coalesce(ControlBrigadasDiario.acum_09, 0)).label("acum_09"),
                func.sum(func.coalesce(ControlBrigadasDiario.acum_10, 0)).label("acum_10"),
                func.sum(func.coalesce(ControlBrigadasDiario.acum_11, 0)).label("acum_11"),
                func.sum(func.coalesce(ControlBrigadasDiario.acum_12, 0)).label("acum_12"),
                func.sum(func.coalesce(ControlBrigadasDiario.acum_13, 0)).label("acum_13"),
                func.sum(func.coalesce(ControlBrigadasDiario.acum_14, 0)).label("acum_14"),
            )
            .filter(ControlBrigadasDiario.fecha_operacional == fecha)
            .filter(ControlBrigadasDiario.tipo_brigada == 'CF')
            .group_by(ControlBrigadasDiario.zona)
            .order_by(ControlBrigadasDiario.zona)
            .all()
        )

        rows_dict = {row.zona: row for row in rows}

        zonas_resultado: List[ResultadoRealCFZonaCalculado] = []
        for z in zonas_activas:
            row = rows_dict.get(z.zona)
            if row:
                zonas_resultado.append(ResultadoRealCFZonaCalculado(
                    zona=row.zona,
                    fecha_operacional=fecha,
                    total_cortes_cf=int(row.total_cortes_cf),
                    corte_en_poste_cf=int(row.corte_en_poste_cf),
                    corte_en_empalme_cf=int(row.corte_en_empalme_cf),
                    visita_fallida_cf=int(row.visita_fallida_cf),
                    primer_corte_cf=row.primer_corte_cf,
                    ultimo_corte_cf=row.ultimo_corte_cf,
                    acum_09=int(row.acum_09),
                    acum_10=int(row.acum_10),
                    acum_11=int(row.acum_11),
                    acum_12=int(row.acum_12),
                    acum_13=int(row.acum_13),
                    acum_14=int(row.acum_14),
                    tiene_brigadas_cf=True
                ))
            else:
                zonas_resultado.append(ResultadoRealCFZonaCalculado(
                    zona=z.zona,
                    fecha_operacional=fecha,
                    total_cortes_cf=0,
                    corte_en_poste_cf=0,
                    corte_en_empalme_cf=0,
                    visita_fallida_cf=0,
                    primer_corte_cf=None,
                    ultimo_corte_cf=None,
                    acum_09=0,
                    acum_10=0,
                    acum_11=0,
                    acum_12=0,
                    acum_13=0,
                    acum_14=0,
                    tiene_brigadas_cf=False
                ))

        return ResultadosRealesCFZonaResponse(
            fecha_operacional=str(fecha),
            zonas=zonas_resultado,
            alertas=alertas,
        )
