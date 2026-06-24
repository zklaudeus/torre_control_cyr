"""
repository.py — Actualización en base de datos.
"""

import pandas as pd
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


def _reemplazar_causas_fallidas(
    db: Session,
    resultados: pd.DataFrame,
    causas_fallidas: pd.DataFrame,
) -> None:
    """Reemplaza el desglose de causas para las brigadas reprocesadas."""
    from app.models.cyr_models import (
        RendimientoTecnicoCausaFallida,
        RendimientoTecnicoDiario,
    )

    pares_validos = {
        (row.fecha_operacional, str(row.codigo_sap))
        for row in resultados[['fecha_operacional', 'codigo_sap']]
        .drop_duplicates()
        .itertuples(index=False)
    }
    if not pares_validos:
        return

    fechas = {fecha for fecha, _ in pares_validos}
    codigos = {codigo for _, codigo in pares_validos}
    rendimientos = db.query(
        RendimientoTecnicoDiario.id,
        RendimientoTecnicoDiario.fecha_operacional,
        RendimientoTecnicoDiario.codigo_sap,
    ).filter(
        RendimientoTecnicoDiario.fecha_operacional.in_(fechas),
        RendimientoTecnicoDiario.codigo_sap.in_(codigos),
    ).all()
    rendimiento_id_por_par = {
        (r.fecha_operacional, r.codigo_sap): r.id
        for r in rendimientos
        if (r.fecha_operacional, r.codigo_sap) in pares_validos
    }

    # El archivo reprocesado es la fuente completa del día: primero quitamos el
    # detalle anterior, incluso si ahora la brigada quedó con cero fallidas.
    for fecha, codigo in pares_validos:
        db.query(RendimientoTecnicoCausaFallida).filter(
            RendimientoTecnicoCausaFallida.fecha_operacional == fecha,
            RendimientoTecnicoCausaFallida.codigo_sap == codigo,
        ).delete(synchronize_session=False)

    if causas_fallidas.empty:
        return

    for row in causas_fallidas.itertuples(index=False):
        par = (row.fecha_operacional, str(row.codigo_sap))
        if par not in pares_validos or int(row.cantidad) <= 0:
            continue
        db.add(RendimientoTecnicoCausaFallida(
            fecha_operacional=row.fecha_operacional,
            codigo_sap=str(row.codigo_sap),
            rendimiento_diario_id=rendimiento_id_por_par.get(par),
            causa_fallida=str(row.causa_fallida)[:200],
            cantidad=int(row.cantidad),
            observacion=row.observacion if pd.notna(row.observacion) else None,
            origen='PROCESAMIENTO_OPERACIONAL',
        ))


def actualizar_resultados(
    db: Session,
    df: pd.DataFrame,
    causas_fallidas: pd.DataFrame | None = None,
) -> int:
    """
    Actualiza los registros en control_brigadas_diario.
    Solo realiza UPDATE, nunca INSERT.
    """
    if df.empty:
        return 0
        
    total_actualizadas = 0
    
    try:
        # Iniciamos un loop por cada fila del DataFrame final
        for _, row in df.iterrows():
            fecha = row['fecha_operacional']
            sap = row['codigo_sap']
            
            # Buscar en BD
            from app.models.cyr_models import ControlBrigadasDiario
            from sqlalchemy import update
            
            stmt = (
                update(ControlBrigadasDiario)
                .where(
                    (ControlBrigadasDiario.fecha_operacional == fecha) & 
                    (ControlBrigadasDiario.codigo_sap == sap)
                )
                .values(
                    reconexiones_ejecutadas=int(row['reconexiones_ejecutadas']),
                    primer_corte=row['primer_corte'] if pd.notna(row['primer_corte']) else None,
                    ultimo_corte=row['ultimo_corte'] if pd.notna(row['ultimo_corte']) else None,
                    acum_09=int(row['acum_09']) if pd.notna(row['acum_09']) else None,
                    acum_10=int(row['acum_10']) if pd.notna(row['acum_10']) else None,
                    acum_11=int(row['acum_11']) if pd.notna(row['acum_11']) else None,
                    acum_12=int(row['acum_12']) if pd.notna(row['acum_12']) else None,
                    acum_13=int(row['acum_13']) if pd.notna(row['acum_13']) else None,
                    acum_14=int(row['acum_14']) if pd.notna(row['acum_14']) else None,
                    total_cortes=int(row['total_cortes']),
                    corte_en_poste=int(row['corte_en_poste']),
                    corte_en_empalme=int(row['corte_en_empalme']),
                    corte_fuera_de_rango=int(row['corte_fuera_de_rango']),
                    visita_fallida=int(row['visita_fallida'])
                )
            )
            
            resultado = db.execute(stmt)
            total_actualizadas += resultado.rowcount

        if causas_fallidas is not None:
            _reemplazar_causas_fallidas(db, df, causas_fallidas)

        from app.modules.productividad.sync import sincronizar_rendimientos_para_pares
        pares = {
            (row.fecha_operacional, str(row.codigo_sap))
            for row in df[['fecha_operacional', 'codigo_sap']]
            .drop_duplicates()
            .itertuples(index=False)
        }
        sincronizar_rendimientos_para_pares(db, pares)

        db.commit()
        return total_actualizadas
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error actualizando resultados en BD: {e}")
        raise e
