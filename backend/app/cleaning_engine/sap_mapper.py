"""
sap_mapper.py — Mapeo de resultados con SAP.
"""

import pandas as pd
from sqlalchemy.orm import Session
from app.models.cyr_models import ControlBrigadasDiario

def cruzar_con_sap(db: Session, df: pd.DataFrame) -> tuple[pd.DataFrame, list[str], list[str], list[str]]:
    """
    Cruza los resultados calculados con control_brigadas_diario para asegurar que solo
    se actualicen brigadas existentes (validación).
    
    Retorna:
        (DataFrame listo para actualizar, usuarios_sin_sap, sap_sin_match, sap_duplicados)
    """
    if df.empty:
        return df, [], [], []
        
    fechas = df['fecha_operacional'].unique().tolist()
    saps = df['codigo_sap'].unique().tolist()
    
    # Obtener registros existentes de la base de datos para esas fechas
    registros_bd = db.query(ControlBrigadasDiario.fecha_operacional, ControlBrigadasDiario.codigo_sap).filter(
        ControlBrigadasDiario.fecha_operacional.in_(fechas)
    ).all()
    
    df_bd = pd.DataFrame(registros_bd, columns=['fecha_operacional', 'codigo_sap'])
    
    if df_bd.empty:
        return pd.DataFrame(), [], saps, []
        
    df_bd['existe_en_bd'] = True
    
    # Validar duplicados en BD (aunque no debería haber si hay restricciones)
    duplicados_bd = df_bd[df_bd.duplicated(['fecha_operacional', 'codigo_sap'], keep=False)]
    sap_duplicados = duplicados_bd['codigo_sap'].unique().tolist()
    
    # Cruzar DataFrame de resultados con registros existentes
    df_merged = pd.merge(
        df, 
        df_bd[['fecha_operacional', 'codigo_sap', 'existe_en_bd']].drop_duplicates(),
        on=['fecha_operacional', 'codigo_sap'],
        how='left'
    )
    
    # Clasificar resultados
    usuarios_sin_sap = df[df['codigo_sap'].isna() | (df['codigo_sap'] == '')]['codigo_sap'].tolist()
    
    sap_sin_match = df_merged[df_merged['existe_en_bd'].isna()]['codigo_sap'].tolist()
    
    # Filtrar solo los que existen en BD para actualizar
    df_final = df_merged[df_merged['existe_en_bd'] == True].copy()
    df_final = df_final.drop(columns=['existe_en_bd'])
    
    return df_final, usuarios_sin_sap, sap_sin_match, sap_duplicados
