"""
classifier.py — Clasificación de medidas y reglas de negocio.
"""

import pandas as pd
from .rules import (
    MEDIDAS_CORTE_POSTE, MEDIDAS_CORTE_EMPALME, MEDIDAS_DESMANTELAMIENTO,
    MEDIDAS_REPOSICION, MEDIDA_FUERA_DE_RANGO, MEDIDAS_FALLIDA,
    FOTO_VALORES_INVALIDOS
)

def _clasificar_fila(row: pd.Series) -> str:
    """Clasifica una fila individual basándose en su medida normalizada."""
    medida = row.get('medida_norm', '')
    foto = row.get('foto_norm', '')
    
    if medida in MEDIDAS_CORTE_POSTE:
        return 'corte_poste'
    elif medida in MEDIDAS_CORTE_EMPALME:
        return 'corte_empalme'
    elif medida in MEDIDAS_DESMANTELAMIENTO:
        return 'desmantelamiento'
    elif medida in MEDIDAS_REPOSICION:
        return 'reposicion'
    elif medida in MEDIDAS_FALLIDA:
        return 'fallida'
    elif medida == MEDIDA_FUERA_DE_RANGO:
        if foto in FOTO_VALORES_INVALIDOS:
            return 'fallida'
        else:
            return 'corte_fuera_de_rango'
    
    return 'otro'

def clasificar_medidas(df: pd.DataFrame) -> pd.DataFrame:
    """Aplica la clasificación a todo el DataFrame."""
    if df.empty:
        df['categoria'] = []
        df['tiene_foto'] = []
        df['fuera_rango_valido'] = []
        return df

    # Trazabilidad
    if 'foto_norm' in df.columns:
        df['tiene_foto'] = ~df['foto_norm'].isin(FOTO_VALORES_INVALIDOS)
    else:
        df['tiene_foto'] = False
        
    df['fuera_rango_valido'] = (df.get('medida_norm', '') == MEDIDA_FUERA_DE_RANGO) & df['tiene_foto']

    # Aplicar clasificación
    df['categoria'] = df.apply(_clasificar_fila, axis=1)
    
    return df
