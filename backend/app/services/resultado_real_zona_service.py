from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import date
from typing import List

from app.schemas.resultado_real_zona import ResultadoRealZonaCalculado, ResultadosRealesZonaResponse
from app.models.cyr_models import ControlBrigadasDiario, ControlParametrosZona
from app.core.brigadas import condicion_brigada_contabilizable


class ResultadoRealZonaService:
    def calcular_por_fecha(self, db: Session, fecha: date) -> ResultadosRealesZonaResponse:
        alertas: List[str] = []

        # Zonas activas para saber qué mostrar aunque no haya brigadas
        zonas_activas = db.query(ControlParametrosZona).filter(
            ControlParametrosZona.activo == True
        ).order_by(ControlParametrosZona.zona).all()

        if not zonas_activas:
            alertas.append("No hay zonas activas configuradas.")

        # Aggregation SQL via SQLAlchemy ORM
        rows = (
            db.query(
                ControlBrigadasDiario.zona,
                func.sum(func.coalesce(ControlBrigadasDiario.reconexiones_ejecutadas, 0)).label("total_reconexiones_ejecutadas"),
                func.sum(
                    func.coalesce(ControlBrigadasDiario.corte_en_poste, 0) +
                    func.coalesce(ControlBrigadasDiario.corte_en_empalme, 0) +
                    func.coalesce(ControlBrigadasDiario.corte_fuera_de_rango, 0)
                ).label("total_cortes"),
                func.sum(func.coalesce(ControlBrigadasDiario.corte_en_poste, 0)).label("corte_en_poste"),
                func.sum(func.coalesce(ControlBrigadasDiario.corte_en_empalme, 0)).label("corte_en_empalme"),
                func.sum(func.coalesce(ControlBrigadasDiario.corte_fuera_de_rango, 0)).label("corte_fuera_de_rango"),
                func.sum(func.coalesce(ControlBrigadasDiario.visita_fallida, 0)).label("visita_fallida"),
                func.min(ControlBrigadasDiario.primer_corte).label("primer_corte"),
                func.max(ControlBrigadasDiario.ultimo_corte).label("ultimo_corte"),
                func.sum(func.coalesce(ControlBrigadasDiario.acum_09, 0)).label("acum_09"),
                func.sum(func.coalesce(ControlBrigadasDiario.acum_10, 0)).label("acum_10"),
                func.sum(func.coalesce(ControlBrigadasDiario.acum_11, 0)).label("acum_11"),
                func.sum(func.coalesce(ControlBrigadasDiario.acum_12, 0)).label("acum_12"),
                func.sum(func.coalesce(ControlBrigadasDiario.acum_13, 0)).label("acum_13"),
                func.sum(func.coalesce(ControlBrigadasDiario.acum_14, 0)).label("acum_14"),
            )
            .filter(
                ControlBrigadasDiario.fecha_operacional == fecha,
                condicion_brigada_contabilizable(ControlBrigadasDiario),
            )
            .group_by(ControlBrigadasDiario.zona)
            .order_by(ControlBrigadasDiario.zona)
            .all()
        )

        if not rows:
            alertas.append("No hay brigadas cargadas para esta fecha. Los resultados no pueden calcularse.")

        # Build dict from query results
        rows_dict = {row.zona: row for row in rows}

        # Build result for every active zona (show zeros for zonas without brigadas)
        zonas_resultado: List[ResultadoRealZonaCalculado] = []
        for z in zonas_activas:
            row = rows_dict.get(z.zona)
            if row:
                zonas_resultado.append(ResultadoRealZonaCalculado(
                    zona=row.zona,
                    fecha_operacional=fecha,
                    total_reconexiones_ejecutadas=int(row.total_reconexiones_ejecutadas),
                    total_cortes=int(row.total_cortes),
                    corte_en_poste=int(row.corte_en_poste),
                    corte_en_empalme=int(row.corte_en_empalme),
                    corte_fuera_de_rango=int(row.corte_fuera_de_rango),
                    visita_fallida=int(row.visita_fallida),
                    primer_corte=row.primer_corte,
                    ultimo_corte=row.ultimo_corte,
                    acum_09=int(row.acum_09),
                    acum_10=int(row.acum_10),
                    acum_11=int(row.acum_11),
                    acum_12=int(row.acum_12),
                    acum_13=int(row.acum_13),
                    acum_14=int(row.acum_14),
                    tiene_brigadas=True,
                ))
            else:
                zonas_resultado.append(ResultadoRealZonaCalculado(
                    zona=z.zona,
                    fecha_operacional=fecha,
                    total_reconexiones_ejecutadas=0,
                    total_cortes=0,
                    corte_en_poste=0,
                    corte_en_empalme=0,
                    corte_fuera_de_rango=0,
                    visita_fallida=0,
                    primer_corte=None,
                    ultimo_corte=None,
                    acum_09=0,
                    acum_10=0,
                    acum_11=0,
                    acum_12=0,
                    acum_13=0,
                    acum_14=0,
                    tiene_brigadas=False,
                ))

        return ResultadosRealesZonaResponse(
            fecha_operacional=str(fecha),
            zonas=zonas_resultado,
            alertas=alertas,
        )
