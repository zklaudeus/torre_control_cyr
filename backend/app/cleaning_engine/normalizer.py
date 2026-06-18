"""
normalizer.py — Normalización de DataFrames operacionales.

- Renombra columnas usando los alias de rules.py
- Normaliza textos (strip)
- Convierte fechas a datetime
"""

import pandas as pd
from .rules import COLUMN_ALIASES

def normalizar_columnas(df: pd.DataFrame) -> pd.DataFrame:
    """Normaliza los nombres de las columnas."""
    # Convertir a minúsculas y quitar espacios extra en los nombres de columnas
    columnas_lower = {col: str(col).lower().strip() for col in df.columns}
    df = df.rename(columns=columnas_lower)
    
    # Aplicar alias
    df = df.rename(columns=COLUMN_ALIASES)
    return df

def normalizar_datos(df: pd.DataFrame) -> pd.DataFrame:
    """Normaliza los datos de las columnas clave."""
    if 'usuario' in df.columns:
        # Renombramos a codigo_sap si no se aplicó el alias (por si acaso)
        df = df.rename(columns={'usuario': 'codigo_sap'})
        
    if 'codigo_sap' in df.columns:
        df['codigo_sap'] = df['codigo_sap'].astype(str).str.strip().str.upper()
        
    if 'medida' in df.columns:
        df['medida_norm'] = df['medida'].astype(str).str.lower().str.strip()
        
    if 'foto' in df.columns:
        df['foto_norm'] = df['foto'].astype(str).str.lower().str.strip()
        
    if 'comuna' in df.columns:
         df['comuna_norm'] = df['comuna'].astype(str).str.lower().str.strip()

    if 'ejecutada' in df.columns:
        # Convertir a datetime, manejar errores y convertir a string ISO para agrupar luego
        df['ejecutada_dt'] = pd.to_datetime(df['ejecutada'], format='%d-%m-%Y %H:%M:%S', errors='coerce')
        # Extraer fecha operacional pura
        df['fecha_operacional'] = df['ejecutada_dt'].dt.date
        
    return df

def procesar(df: pd.DataFrame) -> pd.DataFrame:
    """Orquesta la normalización completa."""
    df = normalizar_columnas(df)
    df = normalizar_datos(df)
    return df
