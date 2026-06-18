"""
deduplicator.py — Eliminación de duplicados.
"""

import pandas as pd
import logging

logger = logging.getLogger(__name__)

def deduplicar(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """
    Deduplica el DataFrame.
    Usa 'aviso_id' (Numero de aviso) como clave principal.
    
    Retorna:
        (DataFrame limpio, cantidad de duplicados eliminados)
    """
    total_original = len(df)
    
    if 'aviso_id' in df.columns:
        # Priorizar filas que tienen un aviso_id válido
        df_validos = df[df['aviso_id'].notna()]
        df_invalidos = df[df['aviso_id'].isna()]
        
        # Deduplicar válidos por aviso_id
        df_validos_unicos = df_validos.drop_duplicates(subset=['aviso_id'], keep='first')
        
        # Deduplicar inválidos por clave compuesta si existen
        if not df_invalidos.empty:
            cols_clave = ['codigo_sap', 'fecha_operacional', 'ejecutada_dt', 'medida_norm']
            cols_existentes = [c for c in cols_clave if c in df_invalidos.columns]
            df_invalidos_unicos = df_invalidos.drop_duplicates(subset=cols_existentes, keep='first')
            
            df_final = pd.concat([df_validos_unicos, df_invalidos_unicos], ignore_index=True)
        else:
            df_final = df_validos_unicos
            
    else:
        # Fallback a clave compuesta si aviso_id no existe
        cols_clave = ['codigo_sap', 'fecha_operacional', 'ejecutada_dt', 'medida_norm']
        cols_existentes = [c for c in cols_clave if c in df.columns]
        df_final = df.drop_duplicates(subset=cols_existentes, keep='first')
        
    duplicados_eliminados = total_original - len(df_final)
    logger.info(f"Deduplicación: eliminados {duplicados_eliminados} duplicados de {total_original} filas.")
    
    return df_final, duplicados_eliminados
