"""
repository.py — Actualización en base de datos.
"""

import pandas as pd
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

def actualizar_resultados(db: Session, df: pd.DataFrame) -> int:
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
            
        db.commit()
        return total_actualizadas
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error actualizando resultados en BD: {e}")
        raise e
