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
        brigadas = db.query(ControlBrigadasDiario).filter(ControlBrigadasDiario.fecha_operacional == fecha).all()

        if not programacion:
            alertas.append("Falta programación para una o más zonas.")
        if not brigadas:
            alertas.append("Faltan brigadas cargadas.")

        prog_dict = {p.zona: p for p in programacion}

        # Agrupar brigadas por zona
        brig_dict: Dict[str, List[ControlBrigadasDiario]] = {}
        for b in brigadas:
            brig_dict.setdefault(b.zona, []).append(b)

        # Acumuladores globales
        t_brig_pxq = 0
        t_brig_cf = 0
        t_brig_conv = 0
        t_brig_rep = 0
        t_brig_contrato = 0
        t_rec_prog = 0
        t_rec_ejec = 0
        t_asig_carga = 0
        t_corte_prog = 0
        t_cortes = 0
        t_actividades = 0

        zonas_resumen: List[ResumenZonaFila] = []

        # 3. Calcular por zona
        for z in zonas_activas:
            nombre_zona = z.zona
            brig_contrato = z.brigadas_contrato
            t_brig_contrato += brig_contrato

            prog = prog_dict.get(nombre_zona)
            rec_prog = prog.reconexiones_programadas if prog else 0
            asig_carga = prog.asignacion_carga if prog else 0
            corte_prog = prog.corte_programado if prog else 0
            t_rec_prog += rec_prog
            t_asig_carga += asig_carga
            t_corte_prog += corte_prog

            brig_zona = brig_dict.get(nombre_zona, [])
            b_pxq = 0
            b_cf = 0
            b_conv = 0
            inactivas_count = 0
            observaciones_inactivas = []

            # Resultados calculados desde brigadas (Ajuste 5.1)
            rec_ejec = 0
            corte_en_poste = 0
            corte_en_empalme = 0
            visita_fallida_zona = 0

            for b in brig_zona:
                if b.tipo_brigada == "PXQ":
                    b_pxq += 1
                elif b.tipo_brigada == "CF":
                    b_cf += 1
                elif b.tipo_brigada == "Convenio":
                    b_conv += 1

                if b.estado_brigada == "Inactiva":
                    inactivas_count += 1
                    if b.observacion_brigada:
                        observaciones_inactivas.append(b.observacion_brigada)

                # Sumar resultados de cada brigada
                rec_ejec += b.reconexiones_ejecutadas or 0
                corte_en_poste += b.corte_en_poste or 0
                corte_en_empalme += b.corte_en_empalme or 0
                visita_fallida_zona += b.visita_fallida or 0

            cortes = corte_en_poste + corte_en_empalme

            t_brig_pxq += b_pxq
            t_brig_cf += b_cf
            t_brig_conv += b_conv
            b_rep = b_pxq + b_cf + b_conv
            t_brig_rep += b_rep
            t_rec_ejec += rec_ejec
            t_cortes += cortes

            obs_text = ""
            if inactivas_count > 0:
                obs_base = f"{inactivas_count} brigada(s) inactiva(s)"
                obs_text = f"{obs_base}: {', '.join(observaciones_inactivas)}" if observaciones_inactivas else obs_base

            # Fórmulas
            porc_brig_efectivas = (b_rep / brig_contrato) if brig_contrato > 0 else 0.0
            prom_rec = (rec_ejec / b_pxq) if b_pxq > 0 else 0.0
            cumpl_corte_porc = (cortes / corte_prog) if corte_prog > 0 else 0.0
            prom_cortes = (cortes / b_pxq) if b_pxq > 0 else 0.0
            actividades = rec_ejec + cortes
            t_actividades += actividades
            prom_actividades = (actividades / b_rep) if b_rep > 0 else 0.0
            cumpl_prom_meta = (prom_cortes / meta_diaria) if meta_diaria > 0 else 0.0

            zonas_resumen.append(ResumenZonaFila(
                zona=nombre_zona,
                brigadas_pxq=b_pxq,
                brigadas_cf=b_cf,
                brigadas_convenio=b_conv,
                total_brigadas_reportadas=b_rep,
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
                observacion=obs_text
            ))

        # 4. Fila total general
        porc_brig_efectivas_tot = (t_brig_rep / t_brig_contrato) if t_brig_contrato > 0 else 0.0
        prom_rec_tot = (t_rec_ejec / t_brig_pxq) if t_brig_pxq > 0 else 0.0
        cumpl_corte_porc_tot = (t_cortes / t_corte_prog) if t_corte_prog > 0 else 0.0
        prom_cortes_tot = (t_cortes / t_brig_pxq) if t_brig_pxq > 0 else 0.0
        prom_actividades_tot = (t_actividades / t_brig_rep) if t_brig_rep > 0 else 0.0
        cumpl_prom_meta_tot = (prom_cortes_tot / meta_diaria) if meta_diaria > 0 else 0.0

        fila_total = ResumenZonaFila(
            zona="TOTAL GENERAL",
            brigadas_pxq=t_brig_pxq,
            brigadas_cf=t_brig_cf,
            brigadas_convenio=t_brig_conv,
            total_brigadas_reportadas=t_brig_rep,
            brigadas_contrato=t_brig_contrato,
            porcentaje_brigadas_efectivas=porc_brig_efectivas_tot,
            reconexiones_programadas=t_rec_prog,
            total_reconexiones_ejecutadas=t_rec_ejec,
            promedio_reconexiones=prom_rec_tot,
            asignacion_carga=t_asig_carga,
            corte_programado=t_corte_prog,
            total_cortes=t_cortes,
            cumplimiento_corte_porcentaje=cumpl_corte_porc_tot,
            promedio_cortes=prom_cortes_tot,
            total_actividades=t_actividades,
            promedio_actividades=prom_actividades_tot,
            cumplimiento_promedio_meta=cumpl_prom_meta_tot,
            observacion=""
        )

        return ResumenZonaResponse(
            fecha_operacional=str(fecha),
            zonas=zonas_resumen,
            total=fila_total,
            alertas=alertas
        )
