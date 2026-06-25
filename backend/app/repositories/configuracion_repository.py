import datetime
from sqlalchemy.orm import Session
from app.schemas.configuracion import ConfiguracionCompleta, ParametrosGenerales, ParametrosZonaConfig, ParametrosAutomatizacion
from app.models.cyr_models import ControlParametrosGenerales, ControlParametrosCFGenerales, ControlParametrosZona

def _time_to_str(t) -> str:
    if t is None:
        return '08:00'
    if isinstance(t, datetime.time):
        return t.strftime('%H:%M')
    return str(t)[:5]

def _str_to_time(s: str) -> datetime.time | None:
    if not s:
        return None
    try:
        parts = s.strip().split(':')
        return datetime.time(int(parts[0]), int(parts[1]))
    except (ValueError, IndexError):
        return None

class ConfiguracionRepository:
    def _read_generales(self, db: Session) -> ControlParametrosGenerales:
        gen = db.query(ControlParametrosGenerales).first()
        if not gen:
            gen = ControlParametrosGenerales()
            db.add(gen)
            db.flush()
        return gen

    def _read_cf_generales(self, db: Session) -> ControlParametrosCFGenerales:
        gen = db.query(ControlParametrosCFGenerales).first()
        if not gen:
            gen = ControlParametrosCFGenerales()
            db.add(gen)
            db.flush()
        return gen

    def get_configuracion(self, db: Session) -> ConfiguracionCompleta:
        gen = self._read_generales(db)
        cf_gen = self._read_cf_generales(db)

        generales = ParametrosGenerales(
            hora_inicio_operacion=_time_to_str(gen.hora_inicio_jornada),
            hora_cierre_operacion=_time_to_str(gen.hora_cierre_jornada),
            hora_corte_gps=_time_to_str(gen.hora_corte_gps),
            meta_diaria_cortes_pxq=gen.meta_diaria_cortes_brigada or 30,
            meta_diaria_cortes_cf=cf_gen.meta_diaria_cortes_brigada or 6,
            meta_diaria_reconexiones=gen.meta_diaria_reconexiones or 15,
            tramo_horario_inicial=_time_to_str(gen.tramo_horario_inicial),
            tramo_horario_final=_time_to_str(gen.tramo_horario_final)
        )

        automatizacion = ParametrosAutomatizacion(
            alerta_sin_brigadas=gen.alerta_sin_brigadas if gen.alerta_sin_brigadas is not None else True,
            alerta_brigadas_efectivas=gen.alerta_brigadas_efectivas if gen.alerta_brigadas_efectivas is not None else True,
            calcular_cumplimiento_carga=gen.calcular_cumplimiento_carga if gen.calcular_cumplimiento_carga is not None else True,
            calcular_promedio_cortes=gen.calcular_promedio_cortes if gen.calcular_promedio_cortes is not None else True,
            calcular_promedio_reconexiones=gen.calcular_promedio_reconexiones if gen.calcular_promedio_reconexiones is not None else True,
            calcular_total_actividades=gen.calcular_total_actividades if gen.calcular_total_actividades is not None else True,
            calcular_cumplimiento_promedio=gen.calcular_cumplimiento_promedio if gen.calcular_cumplimiento_promedio is not None else True,
            generar_observacion_automatica=gen.generar_observacion_automatica if gen.generar_observacion_automatica is not None else True
        )

        all_zonas = ["Iquique", "Coquimbo", "Santa Cruz", "Talca", "Concepción", "Los Ángeles", "Chillán"]

        zonas_db = db.query(ControlParametrosZona).all()
        
        pxq_list = []
        cf_list = []

        for z_name in all_zonas:
            pxq_db = next((z for z in zonas_db if z.zona == z_name and z.tipo_brigada == 'PXQ'), None)
            pxq_list.append(ParametrosZonaConfig(
                zona=z_name,
                activa=pxq_db.activo if pxq_db else False,
                brigadas_contrato=pxq_db.brigadas_contrato if pxq_db else 0,
                meta_diaria_cortes=pxq_db.meta_diaria_cortes if pxq_db and pxq_db.meta_diaria_cortes is not None else (gen.meta_diaria_cortes_brigada or 30),
                meta_acumulada_09=pxq_db.meta_acumulada_09 if pxq_db and pxq_db.meta_acumulada_09 is not None else 5,
                meta_acumulada_10=pxq_db.meta_acumulada_10 if pxq_db and pxq_db.meta_acumulada_10 is not None else 10,
                meta_acumulada_11=pxq_db.meta_acumulada_11 if pxq_db and pxq_db.meta_acumulada_11 is not None else 15,
                meta_acumulada_12=pxq_db.meta_acumulada_12 if pxq_db and pxq_db.meta_acumulada_12 is not None else 20,
                meta_acumulada_13=pxq_db.meta_acumulada_13 if pxq_db and pxq_db.meta_acumulada_13 is not None else 25,
                meta_acumulada_14=pxq_db.meta_acumulada_14 if pxq_db and pxq_db.meta_acumulada_14 is not None else 30,
                hora_inicio=_time_to_str(pxq_db.hora_inicio if pxq_db else None),
                hora_cierre=_time_to_str(pxq_db.hora_cierre if pxq_db else None)
            ))

            cf_db = next((z for z in zonas_db if z.zona == z_name and z.tipo_brigada == 'CF'), None)
            cf_list.append(ParametrosZonaConfig(
                zona=z_name,
                activa=cf_db.activo if cf_db else False,
                brigadas_contrato=cf_db.brigadas_contrato if cf_db else 0,
                meta_diaria_cortes=cf_db.meta_diaria_cortes if cf_db and cf_db.meta_diaria_cortes is not None else (cf_gen.meta_diaria_cortes_brigada or 6),
                meta_acumulada_09=cf_db.meta_acumulada_09 if cf_db and cf_db.meta_acumulada_09 is not None else (cf_gen.meta_acumulada_09 or 1),
                meta_acumulada_10=cf_db.meta_acumulada_10 if cf_db and cf_db.meta_acumulada_10 is not None else (cf_gen.meta_acumulada_10 or 1),
                meta_acumulada_11=cf_db.meta_acumulada_11 if cf_db and cf_db.meta_acumulada_11 is not None else (cf_gen.meta_acumulada_11 or 1),
                meta_acumulada_12=cf_db.meta_acumulada_12 if cf_db and cf_db.meta_acumulada_12 is not None else (cf_gen.meta_acumulada_12 or 1),
                meta_acumulada_13=cf_db.meta_acumulada_13 if cf_db and cf_db.meta_acumulada_13 is not None else (cf_gen.meta_acumulada_13 or 1),
                meta_acumulada_14=cf_db.meta_acumulada_14 if cf_db and cf_db.meta_acumulada_14 is not None else (cf_gen.meta_acumulada_14 or 1),
                hora_inicio=_time_to_str(cf_db.hora_inicio if cf_db else None),
                hora_cierre=_time_to_str(cf_db.hora_cierre if cf_db else None)
            ))

        return ConfiguracionCompleta(
            generales=generales,
            pxq=pxq_list,
            cf=cf_list,
            automatizacion=automatizacion
        )

    def save_configuracion(self, db: Session, config: ConfiguracionCompleta):
        gen = self._read_generales(db)
        cf_gen = self._read_cf_generales(db)

        # --- Generales (PXQ) ---
        gen.hora_inicio_jornada = _str_to_time(config.generales.hora_inicio_operacion)
        gen.hora_cierre_jornada = _str_to_time(config.generales.hora_cierre_operacion)
        gen.hora_corte_gps = _str_to_time(config.generales.hora_corte_gps)
        gen.meta_diaria_cortes_brigada = config.generales.meta_diaria_cortes_pxq
        gen.meta_diaria_reconexiones = config.generales.meta_diaria_reconexiones
        gen.tramo_horario_inicial = _str_to_time(config.generales.tramo_horario_inicial)
        gen.tramo_horario_final = _str_to_time(config.generales.tramo_horario_final)

        # --- Automatizacion ---
        gen.alerta_sin_brigadas = config.automatizacion.alerta_sin_brigadas
        gen.alerta_brigadas_efectivas = config.automatizacion.alerta_brigadas_efectivas
        gen.calcular_cumplimiento_carga = config.automatizacion.calcular_cumplimiento_carga
        gen.calcular_promedio_cortes = config.automatizacion.calcular_promedio_cortes
        gen.calcular_promedio_reconexiones = config.automatizacion.calcular_promedio_reconexiones
        gen.calcular_total_actividades = config.automatizacion.calcular_total_actividades
        gen.calcular_cumplimiento_promedio = config.automatizacion.calcular_cumplimiento_promedio
        gen.generar_observacion_automatica = config.automatizacion.generar_observacion_automatica

        # --- CF Generales ---
        cf_gen.meta_diaria_cortes_brigada = config.generales.meta_diaria_cortes_cf
        cf_gen.meta_diaria_reconexiones = config.generales.meta_diaria_reconexiones
        cf_gen.tramo_horario_inicial = _str_to_time(config.generales.tramo_horario_inicial)
        cf_gen.tramo_horario_final = _str_to_time(config.generales.tramo_horario_final)

        # --- PXQ Zones ---
        for pxq_item in config.pxq:
            z_db = db.query(ControlParametrosZona).filter_by(zona=pxq_item.zona, tipo_brigada='PXQ').first()
            if not z_db:
                z_db = ControlParametrosZona(zona=pxq_item.zona, tipo_brigada='PXQ')
                db.add(z_db)
            z_db.activo = pxq_item.activa
            z_db.brigadas_contrato = pxq_item.brigadas_contrato
            z_db.meta_diaria_cortes = pxq_item.meta_diaria_cortes
            z_db.meta_acumulada_09 = pxq_item.meta_acumulada_09
            z_db.meta_acumulada_10 = pxq_item.meta_acumulada_10
            z_db.meta_acumulada_11 = pxq_item.meta_acumulada_11
            z_db.meta_acumulada_12 = pxq_item.meta_acumulada_12
            z_db.meta_acumulada_13 = pxq_item.meta_acumulada_13
            z_db.meta_acumulada_14 = pxq_item.meta_acumulada_14
            z_db.hora_inicio = _str_to_time(pxq_item.hora_inicio)
            z_db.hora_cierre = _str_to_time(pxq_item.hora_cierre)

        # --- CF Zones ---
        for cf_item in config.cf:
            z_db = db.query(ControlParametrosZona).filter_by(zona=cf_item.zona, tipo_brigada='CF').first()
            if not z_db:
                z_db = ControlParametrosZona(zona=cf_item.zona, tipo_brigada='CF')
                db.add(z_db)
            z_db.activo = cf_item.activa
            z_db.brigadas_contrato = cf_item.brigadas_contrato
            z_db.meta_diaria_cortes = cf_item.meta_diaria_cortes
            z_db.meta_acumulada_09 = cf_item.meta_acumulada_09
            z_db.meta_acumulada_10 = cf_item.meta_acumulada_10
            z_db.meta_acumulada_11 = cf_item.meta_acumulada_11
            z_db.meta_acumulada_12 = cf_item.meta_acumulada_12
            z_db.meta_acumulada_13 = cf_item.meta_acumulada_13
            z_db.meta_acumulada_14 = cf_item.meta_acumulada_14
            z_db.hora_inicio = _str_to_time(cf_item.hora_inicio)
            z_db.hora_cierre = _str_to_time(cf_item.hora_cierre)

        db.commit()
