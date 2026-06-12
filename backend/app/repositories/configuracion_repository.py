from sqlalchemy.orm import Session
from sqlalchemy import text
from app.schemas.configuracion import ConfiguracionCompleta, ParametrosGenerales, ParametrosZonaConfig, ParametrosAutomatizacion
from app.models.cyr_models import ControlParametrosGenerales, ControlParametrosCFGenerales, ControlParametrosZona
from app.repositories.parametro_zona_repository import ParametroZonaRepository
from typing import List

class ConfiguracionRepository:
    def get_configuracion(self, db: Session) -> ConfiguracionCompleta:
        # Get general parameters
        gen = db.query(ControlParametrosGenerales).first()
        cf_gen = db.query(ControlParametrosCFGenerales).first()

        # Defaults if not present
        hora_inicio_op = gen.hora_inicio_jornada.strftime('%H:%M') if gen and gen.hora_inicio_jornada else '08:00'
        hora_cierre_op = gen.hora_cierre_jornada.strftime('%H:%M') if gen and gen.hora_cierre_jornada else '18:00'
        
        generales = ParametrosGenerales(
            hora_inicio_operacion=hora_inicio_op,
            hora_cierre_operacion=hora_cierre_op,
            hora_corte_gps='16:00',
            meta_diaria_cortes_pxq=gen.meta_diaria_cortes_brigada if gen else 30,
            meta_diaria_cortes_cf=cf_gen.meta_diaria_cortes_brigada if cf_gen else 6,
            meta_diaria_reconexiones=15,
            tramo_horario_inicial='09:00',
            tramo_horario_final='14:00'
        )

        automatizacion = ParametrosAutomatizacion(
            alerta_sin_brigadas=True,
            alerta_brigadas_efectivas=True,
            calcular_cumplimiento_carga=True,
            calcular_promedio_cortes=True,
            calcular_promedio_reconexiones=True,
            calcular_total_actividades=True,
            calcular_cumplimiento_promedio=True,
            generar_observacion_automatica=True
        )

        all_zonas = ["Iquique", "Coquimbo", "Santa Cruz", "Talca", "Concepción", "Los Ángeles", "Chillán"]

        zonas_db = db.query(ControlParametrosZona).all()
        
        pxq_list = []
        cf_list = []

        for z_name in all_zonas:
            # PXQ
            pxq_db = next((z for z in zonas_db if z.zona == z_name and z.tipo_brigada == 'PXQ'), None)
            pxq_list.append(ParametrosZonaConfig(
                zona=z_name,
                activa=pxq_db.activo if pxq_db else False,
                brigadas_contrato=pxq_db.brigadas_contrato if pxq_db else 0,
                meta_diaria_cortes=gen.meta_diaria_cortes_brigada if gen else 30,
                meta_acumulada_09=5,
                meta_acumulada_10=10,
                meta_acumulada_11=15,
                meta_acumulada_12=20,
                meta_acumulada_13=25,
                meta_acumulada_14=30,
                hora_inicio=hora_inicio_op,
                hora_cierre=hora_cierre_op
            ))

            # CF
            cf_db = next((z for z in zonas_db if z.zona == z_name and z.tipo_brigada == 'CF'), None)
            cf_list.append(ParametrosZonaConfig(
                zona=z_name,
                activa=cf_db.activo if cf_db else False,
                brigadas_contrato=cf_db.brigadas_contrato if cf_db else 0,
                meta_diaria_cortes=cf_gen.meta_diaria_cortes_brigada if cf_gen else 6,
                meta_acumulada_09=cf_gen.meta_acumulada_09 if cf_gen else 1,
                meta_acumulada_10=cf_gen.meta_acumulada_10 if cf_gen else 1,
                meta_acumulada_11=cf_gen.meta_acumulada_11 if cf_gen else 1,
                meta_acumulada_12=cf_gen.meta_acumulada_12 if cf_gen else 1,
                meta_acumulada_13=cf_gen.meta_acumulada_13 if cf_gen else 1,
                meta_acumulada_14=cf_gen.meta_acumulada_14 if cf_gen else 1,
                hora_inicio=cf_gen.hora_inicio_jornada.strftime('%H:%M') if cf_gen and cf_gen.hora_inicio_jornada else '08:00',
                hora_cierre=cf_gen.hora_cierre_jornada.strftime('%H:%M') if cf_gen and cf_gen.hora_cierre_jornada else '14:00'
            ))

        return ConfiguracionCompleta(
            generales=generales,
            pxq=pxq_list,
            cf=cf_list,
            automatizacion=automatizacion
        )

    def save_configuracion(self, db: Session, config: ConfiguracionCompleta):
        # Update zones
        for pxq_item in config.pxq:
            z_db = db.query(ControlParametrosZona).filter_by(zona=pxq_item.zona, tipo_brigada='PXQ').first()
            if not z_db:
                z_db = ControlParametrosZona(zona=pxq_item.zona, tipo_brigada='PXQ')
                db.add(z_db)
            z_db.activo = pxq_item.activa
            z_db.brigadas_contrato = pxq_item.brigadas_contrato

        for cf_item in config.cf:
            z_db = db.query(ControlParametrosZona).filter_by(zona=cf_item.zona, tipo_brigada='CF').first()
            if not z_db:
                z_db = ControlParametrosZona(zona=cf_item.zona, tipo_brigada='CF')
                db.add(z_db)
            z_db.activo = cf_item.activa
            z_db.brigadas_contrato = cf_item.brigadas_contrato

        # Not updating generales/automatizacion for now since the UI doesn't send anything beyond the mock, 
        # but we could update them if needed. The main goal is fixing the zone logic.
        db.commit()
