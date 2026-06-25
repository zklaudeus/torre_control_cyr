from sqlalchemy.orm import Session
from datetime import date
from typing import List, Dict

from app.schemas.reporte_gerencial_cyr import ReporteGerencialData, ZonaGerencialData
from app.models.cyr_models import (
    ControlParametrosZona,
    ControlParametrosGenerales,
    ControlProgramacionZona,
    ControlBrigadasDiario,
)
from app.core.brigadas import (
    condicion_brigada_contabilizable,
    es_brigada_contabilizable,
)

class ReporteGerencialCYRService:
    def calcular_reporte(self, db: Session, fecha: date, filtro: str = "Todo") -> ReporteGerencialData:
        # 1. Obtener parámetros
        zonas_activas = db.query(ControlParametrosZona).filter(ControlParametrosZona.activo == True).all()
        param_gen = db.query(ControlParametrosGenerales).filter(ControlParametrosGenerales.activo == True).first()
        meta_diaria_cortes_brigada = param_gen.meta_diaria_cortes_brigada if param_gen and param_gen.meta_diaria_cortes_brigada else 30.0

        # 2. Datos del día
        q_prog = db.query(ControlProgramacionZona).filter(ControlProgramacionZona.fecha_operacional == fecha)
        q_brig = db.query(ControlBrigadasDiario).filter(
            ControlBrigadasDiario.fecha_operacional == fecha,
            condicion_brigada_contabilizable(ControlBrigadasDiario),
        )

        # Aplicar filtro si corresponde
        filtro_upper = filtro.upper()
        if filtro_upper in ["PXQ", "CF"]:
            q_prog = q_prog.filter(ControlProgramacionZona.tipo_brigada == filtro_upper)
            q_brig = q_brig.filter(ControlBrigadasDiario.tipo_brigada == filtro_upper)
        
        programacion = q_prog.all()
        brigadas = [b for b in q_brig.all() if es_brigada_contabilizable(b)]

        prog_dict = {}
        for p in programacion:
            # Sumar por zona
            if p.zona not in prog_dict:
                prog_dict[p.zona] = {
                    "reconexiones_programadas": 0.0,
                    "corte_programado": 0.0,
                    "asignacion_carga": 0.0
                }
            prog_dict[p.zona]["reconexiones_programadas"] += float(p.reconexiones_programadas or 0)
            prog_dict[p.zona]["corte_programado"] += float(p.corte_programado or 0)
            prog_dict[p.zona]["asignacion_carga"] += float(getattr(p, 'asignacion_carga', 0) or 0)

        brig_dict: Dict[str, List[ControlBrigadasDiario]] = {}
        for b in brigadas:
            brig_dict.setdefault(b.zona, []).append(b)
        
        # Agrupar las zonas únicas
        nombres_zonas = sorted(list({z.zona for z in zonas_activas} | set(prog_dict.keys()) | set(brig_dict.keys())))

        zonas_resumen: List[ZonaGerencialData] = []

        total_brigadas_operativas = 0
        total_total_brigadas = 0
        total_reconexiones_programadas = 0.0
        total_reconexiones_ejecutadas = 0.0
        total_corte_programado = 0.0
        total_asignacion_carga = 0.0
        total_cortes_ejecutados = 0.0
        total_corte_en_poste = 0.0
        total_corte_en_empalme = 0.0
        total_corte_fuera_de_rango = 0.0
        total_visitas_fallidas = 0.0

        for nombre_zona in nombres_zonas:
            prog = prog_dict.get(nombre_zona, {"reconexiones_programadas": 0.0, "corte_programado": 0.0, "asignacion_carga": 0.0})
            rec_prog = prog["reconexiones_programadas"]
            corte_prog = prog["corte_programado"]
            asig_carga = prog["asignacion_carga"]

            brig_zona = brig_dict.get(nombre_zona, [])
            brigadas_operativas = len(brig_zona)

            # Contrato: param zona si es "Todo", sumar PXQ y CF. Si es filtro, solo ese.
            total_brigadas = 0
            for param in zonas_activas:
                if param.zona == nombre_zona:
                    if filtro_upper == "TODO" or param.tipo_brigada == filtro_upper:
                        total_brigadas += int(param.brigadas_contrato or 0)

            rec_ejec = sum(float(b.reconexiones_ejecutadas or 0) for b in brig_zona)
            c_poste = sum(float(b.corte_en_poste or 0) for b in brig_zona)
            c_empalme = sum(float(b.corte_en_empalme or 0) for b in brig_zona)
            c_fdr = sum(float(getattr(b, "corte_fuera_de_rango", 0) or 0) for b in brig_zona)
            visitas_fallidas = sum(float(b.visita_fallida or 0) for b in brig_zona)

            cortes_ejecutados = c_poste + c_empalme + c_fdr

            prom_rec = (rec_ejec / brigadas_operativas) if brigadas_operativas > 0 else 0.0
            prom_cortes = (cortes_ejecutados / brigadas_operativas) if brigadas_operativas > 0 else 0.0
            prom_actividad = ((rec_ejec + cortes_ejecutados) / brigadas_operativas) if brigadas_operativas > 0 else 0.0

            cumpl_meta_pct = (prom_actividad / meta_diaria_cortes_brigada * 100) if meta_diaria_cortes_brigada > 0 else 0.0
            cumpl_corte_pct = (cortes_ejecutados / asig_carga * 100) if asig_carga > 0 else 0.0

            zonas_resumen.append(ZonaGerencialData(
                zona=nombre_zona,
                brigadas_operativas=brigadas_operativas,
                total_brigadas=total_brigadas,
                reconexiones_programadas=rec_prog,
                reconexiones_ejecutadas=rec_ejec,
                promedio_reconexiones=round(prom_rec, 2),
                corte_programado=corte_prog,
                cortes_ejecutados=cortes_ejecutados,
                promedio_cortes=round(prom_cortes, 2),
                promedio_actividad=round(prom_actividad, 2),
                corte_en_poste=c_poste,
                corte_en_empalme=c_empalme,
                corte_fuera_de_rango=c_fdr,
                visitas_fallidas=visitas_fallidas,
                cumplimiento_meta_pct=round(cumpl_meta_pct, 2),
                cumplimiento_corte_pct=round(cumpl_corte_pct, 2)
            ))

            total_brigadas_operativas += brigadas_operativas
            total_total_brigadas += total_brigadas
            total_reconexiones_programadas += rec_prog
            total_reconexiones_ejecutadas += rec_ejec
            total_corte_programado += corte_prog
            total_asignacion_carga += asig_carga
            total_cortes_ejecutados += cortes_ejecutados
            total_corte_en_poste += c_poste
            total_corte_en_empalme += c_empalme
            total_corte_fuera_de_rango += c_fdr
            total_visitas_fallidas += visitas_fallidas

        tot_prom_rec = (total_reconexiones_ejecutadas / total_brigadas_operativas) if total_brigadas_operativas > 0 else 0.0
        tot_prom_cortes = (total_cortes_ejecutados / total_brigadas_operativas) if total_brigadas_operativas > 0 else 0.0
        tot_prom_actividad = ((total_reconexiones_ejecutadas + total_cortes_ejecutados) / total_brigadas_operativas) if total_brigadas_operativas > 0 else 0.0

        tot_cumpl_meta_pct = (tot_prom_actividad / meta_diaria_cortes_brigada * 100) if meta_diaria_cortes_brigada > 0 else 0.0
        tot_cumpl_corte_pct = (total_cortes_ejecutados / total_asignacion_carga * 100) if total_asignacion_carga > 0 else 0.0

        fila_total = ZonaGerencialData(
            zona="TOTAL",
            brigadas_operativas=total_brigadas_operativas,
            total_brigadas=total_total_brigadas,
            reconexiones_programadas=total_reconexiones_programadas,
            reconexiones_ejecutadas=total_reconexiones_ejecutadas,
            promedio_reconexiones=round(tot_prom_rec, 2),
            corte_programado=total_corte_programado,
            cortes_ejecutados=total_cortes_ejecutados,
            promedio_cortes=round(tot_prom_cortes, 2),
            promedio_actividad=round(tot_prom_actividad, 2),
            corte_en_poste=total_corte_en_poste,
            corte_en_empalme=total_corte_en_empalme,
            corte_fuera_de_rango=total_corte_fuera_de_rango,
            visitas_fallidas=total_visitas_fallidas,
            cumplimiento_meta_pct=round(tot_cumpl_meta_pct, 2),
            cumplimiento_corte_pct=round(tot_cumpl_corte_pct, 2)
        )

        return ReporteGerencialData(
            fecha_operacional=str(fecha),
            zonas=zonas_resumen,
            total=fila_total
        )
