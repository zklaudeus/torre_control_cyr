from sqlalchemy.orm import Session
from datetime import date
from typing import List, Dict

from app.schemas.resumen_zona import ResumenZonaResponse, ResumenZonaFila
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


class ResumenZonaService:
    def calcular_resumen(self, db: Session, fecha: date) -> ResumenZonaResponse:
        alertas: List[str] = []

        # 1. Parámetros
        zonas_activas = db.query(ControlParametrosZona).filter(ControlParametrosZona.activo == True).all()
        if not zonas_activas:
            alertas.append("No hay zonas activas configuradas.")

        param_gen = db.query(ControlParametrosGenerales).filter(ControlParametrosGenerales.activo == True).first()
        meta_diaria = param_gen.meta_diaria_cortes_brigada if param_gen else 30

        # 2. Datos del día
        programacion = db.query(ControlProgramacionZona).filter(ControlProgramacionZona.fecha_operacional == fecha).all()
        brigadas = db.query(ControlBrigadasDiario).filter(
            ControlBrigadasDiario.fecha_operacional == fecha,
            condicion_brigada_contabilizable(ControlBrigadasDiario),
        ).all()
        brigadas = [b for b in brigadas if es_brigada_contabilizable(b)]

        if not programacion:
            alertas.append("Falta programación para una o más zonas.")
        if not brigadas:
            alertas.append("Faltan brigadas cargadas.")

        prog_dict = {(p.zona, p.tipo_brigada): p for p in programacion}

        # Agrupar brigadas por (zona, tipo_brigada)
        brig_dict: Dict[tuple, List[ControlBrigadasDiario]] = {}
        for b in brigadas:
            if b.tipo_brigada in ("PXQ", "CF"):
                brig_dict.setdefault((b.zona, b.tipo_brigada), []).append(b)

        # Totales generales por tipo de brigada
        totales = {
            "PXQ": {"b_rep": 0, "b_ctto": 0, "rec_prog": 0, "rec_ejec": 0, "asig_carga": 0, "corte_prog": 0, "cortes": 0, "actividades": 0},
            "CF": {"b_rep": 0, "b_ctto": 0, "rec_prog": 0, "rec_ejec": 0, "asig_carga": 0, "corte_prog": 0, "cortes": 0, "actividades": 0}
        }

        zonas_resumen: List[ResumenZonaFila] = []

        # Agrupar las zonas únicas de control_parametros_zona
        nombres_zonas = sorted(list(set(z.zona for z in zonas_activas)))
        
        # Variable para acumular el contrato global (sumando 1 sola vez por zona)
        suma_ctto_global_consolidado = 0

        # 3. Calcular por zona y tipo_brigada
        for nombre_zona in nombres_zonas:
            # Calcular totales de la zona para Porcentaje de Brigadas Efectivas consolidado
            zona_b_rep_total = len(brig_dict.get((nombre_zona, "PXQ"), [])) + len(brig_dict.get((nombre_zona, "CF"), []))
            param_pxq = next((z for z in zonas_activas if z.zona == nombre_zona and z.tipo_brigada == "PXQ"), None)
            param_cf = next((z for z in zonas_activas if z.zona == nombre_zona and z.tipo_brigada == "CF"), None)
            # El contrato es de la zona completa, tomamos el valor mayor que hayan configurado
            ctto_pxq = param_pxq.brigadas_contrato if param_pxq else 0
            ctto_cf = param_cf.brigadas_contrato if param_cf else 0
            zona_ctto_total = max(ctto_pxq, ctto_cf)
            
            # Acumular al global
            suma_ctto_global_consolidado += zona_ctto_total
            
            porc_brig_efectivas_zona = (zona_b_rep_total / zona_ctto_total) if zona_ctto_total > 0 else 0.0

            for tipo in ["PXQ", "CF"]:
                # Buscar parámetros específicos para esta zona y tipo
                param_zona = next((z for z in zonas_activas if z.zona == nombre_zona and z.tipo_brigada == tipo), None)
                brig_contrato = param_zona.brigadas_contrato if param_zona else 0
                
                # Buscar programación
                prog = prog_dict.get((nombre_zona, tipo))
                rec_prog = prog.reconexiones_programadas if prog else 0
                asig_carga = prog.asignacion_carga if prog else 0
                corte_prog = prog.corte_programado if prog else 0
                
                # Buscar brigadas
                brig_zona_tipo = brig_dict.get((nombre_zona, tipo), [])
                b_rep = len(brig_zona_tipo)
                
                rec_ejec = 0
                cortes = 0
                
                for b in brig_zona_tipo:
                    rec_ejec += b.reconexiones_ejecutadas or 0
                    cortes += (b.corte_en_poste or 0) + (b.corte_en_empalme or 0) + (b.corte_fuera_de_rango or 0)
                
                actividades = rec_ejec + cortes
                
                # Acumular para totales globales
                totales[tipo]["b_rep"] += b_rep
                totales[tipo]["b_ctto"] += brig_contrato
                totales[tipo]["rec_prog"] += rec_prog
                totales[tipo]["rec_ejec"] += rec_ejec
                totales[tipo]["asig_carga"] += asig_carga
                totales[tipo]["corte_prog"] += corte_prog
                totales[tipo]["cortes"] += cortes
                totales[tipo]["actividades"] += actividades
                
                # Fórmulas
                porc_brig_efectivas = porc_brig_efectivas_zona
                prom_rec = (rec_ejec / b_rep) if b_rep > 0 else 0.0
                cumpl_corte_porc = (cortes / corte_prog) if corte_prog > 0 else 0.0
                prom_cortes = (cortes / b_rep) if b_rep > 0 else 0.0
                prom_actividades = (actividades / b_rep) if b_rep > 0 else 0.0
                cumpl_prom_meta = (cortes / (b_rep * meta_diaria)) if (b_rep * meta_diaria) > 0 else 0.0
                
                # Omitir filas vacías donde no hay ni brigadas reportadas ni contrato
                if b_rep == 0 and brig_contrato == 0 and not param_zona and not prog:
                    continue

                zonas_resumen.append(ResumenZonaFila(
                    zona=nombre_zona,
                    tipo_brigada=tipo,
                    brigadas_reportadas=b_rep,
                    brigadas_contrato=brig_contrato,
                    porcentaje_brigadas_efectivas=porc_brig_efectivas,
                    reconexiones_programadas=rec_prog,
                    total_reconexiones_ejecutadas=rec_ejec,
                    promedio_reconexiones=prom_rec,
                    asignacion_carga=asig_carga,
                    corte_programado=corte_prog,
                    total_cortes=cortes,
                    cumplimiento_corte_porcentaje=cumpl_corte_porc,
                    promedio_cortes=prom_cortes,
                    total_actividades=actividades,
                    promedio_actividades=prom_actividades,
                    cumplimiento_promedio_meta=cumpl_prom_meta,
                    observacion=""
                ))

        # 4. Filas totales generales por tipo
        # Calcular % brigadas efectivas total general (sumando PXQ y CF globalmente)
        total_global_b_rep = totales["PXQ"]["b_rep"] + totales["CF"]["b_rep"]
        total_global_b_ctto = suma_ctto_global_consolidado
        porc_brig_efectivas_global = (total_global_b_rep / total_global_b_ctto) if total_global_b_ctto > 0 else 0.0

        filas_totales = []
        for tipo in ["PXQ", "CF"]:
            t = totales[tipo]
            if t["b_rep"] == 0 and t["b_ctto"] == 0 and t["rec_prog"] == 0:
                continue
                
            porc_brig_efectivas_tot = porc_brig_efectivas_global
            prom_rec_tot = (t["rec_ejec"] / t["b_rep"]) if t["b_rep"] > 0 else 0.0
            cumpl_corte_porc_tot = (t["cortes"] / t["corte_prog"]) if t["corte_prog"] > 0 else 0.0
            prom_cortes_tot = (t["cortes"] / t["b_rep"]) if t["b_rep"] > 0 else 0.0
            prom_actividades_tot = (t["actividades"] / t["b_rep"]) if t["b_rep"] > 0 else 0.0
            cumpl_prom_meta_tot = (t["cortes"] / (t["b_rep"] * meta_diaria)) if (t["b_rep"] * meta_diaria) > 0 else 0.0

            filas_totales.append(ResumenZonaFila(
                zona="TOTAL GENERAL",
                tipo_brigada=tipo,
                brigadas_reportadas=t["b_rep"],
                brigadas_contrato=t["b_ctto"],
                porcentaje_brigadas_efectivas=porc_brig_efectivas_tot,
                reconexiones_programadas=t["rec_prog"],
                total_reconexiones_ejecutadas=t["rec_ejec"],
                promedio_reconexiones=prom_rec_tot,
                asignacion_carga=t["asig_carga"],
                corte_programado=t["corte_prog"],
                total_cortes=t["cortes"],
                cumplimiento_corte_porcentaje=cumpl_corte_porc_tot,
                promedio_cortes=prom_cortes_tot,
                total_actividades=t["actividades"],
                promedio_actividades=prom_actividades_tot,
                cumplimiento_promedio_meta=cumpl_prom_meta_tot,
                observacion=""
            ))

        return ResumenZonaResponse(
            fecha_operacional=str(fecha),
            zonas=zonas_resumen,
            totales=filas_totales,
            alertas=alertas
        )
