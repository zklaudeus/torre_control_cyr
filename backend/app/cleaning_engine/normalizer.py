"""
normalizer.py — Normalización de DataFrames operacionales.

- Renombra columnas usando los alias de rules.py
- Normaliza textos (strip)
- Convierte fechas a datetime
"""

import pandas as pd
import unicodedata
import re
from .rules import COLUMN_ALIASES

def normalizar_texto(texto) -> str:
    if pd.isna(texto):
        return ""
    texto = str(texto).lower().strip()
    texto = ''.join((c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn'))
    texto = re.sub(r'\s+', ' ', texto)
    return texto

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
    from .rules import USUARIO_ALIAS

    if 'usuario' in df.columns:
        # Renombramos a codigo_sap si no se aplicó el alias (por si acaso)
        df = df.rename(columns={'usuario': 'codigo_sap'})
        
    if 'codigo_sap' not in df.columns:
        df['codigo_sap'] = None
    if 'usuario_nombre' not in df.columns:
        df['usuario_nombre'] = None

    for idx, row in df.iterrows():
        sap = row['codigo_sap']
        nombre = row['usuario_nombre']
        
        sap_norm = normalizar_texto(sap)
        nombre_norm = normalizar_texto(nombre)
        
        # El match debe hacerse preferentemente por codigo_sap.
        # Si encuentra alias en sap o en nombre, asignar codigo_sap correcto.
        if sap_norm in USUARIO_ALIAS:
            df.at[idx, 'codigo_sap'] = USUARIO_ALIAS[sap_norm]['codigo_sap']
            df.at[idx, 'usuario_nombre'] = USUARIO_ALIAS[sap_norm]['usuario_visual']
        elif nombre_norm in USUARIO_ALIAS:
            if pd.isna(sap) or str(sap).strip() == "" or sap_norm == "nan":
                df.at[idx, 'codigo_sap'] = USUARIO_ALIAS[nombre_norm]['codigo_sap']
            df.at[idx, 'usuario_nombre'] = USUARIO_ALIAS[nombre_norm]['usuario_visual']

    df['codigo_sap'] = df['codigo_sap'].astype(str).str.strip().str.upper()
    df.loc[df['codigo_sap'] == 'NONE', 'codigo_sap'] = None
    df.loc[df['codigo_sap'] == 'NAN', 'codigo_sap'] = None
        
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
