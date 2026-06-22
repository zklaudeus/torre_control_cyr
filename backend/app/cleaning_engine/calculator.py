"""
calculator.py — Cálculo de KPIs por usuario.
"""

import pandas as pd
from .rules import CATEGORIAS_TOTAL_CORTES, CATEGORIAS_RECONEXIONES, PROCESO_A_ZONA, COMUNA_A_ZONA

def _asignar_zona(row: pd.Series) -> str:
    """Asigna la zona geográfica basándose en el proceso o comuna."""
    proceso = str(row.get('proceso', '')).upper()
    # Buscar prefijos de proceso
    for prefijo, zona in PROCESO_A_ZONA.items():
        if prefijo in proceso:
            return zona
            
    comuna = str(row.get('comuna_norm', ''))
    return COMUNA_A_ZONA.get(comuna, 'Desconocida')

def calcular_kpis(df: pd.DataFrame) -> pd.DataFrame:
    """Calcula los KPIs agrupados por zona, fecha y usuario."""
    if df.empty:
        return pd.DataFrame()
        
    # Asignar zona si no existe
    df['zona_calculada'] = df.apply(_asignar_zona, axis=1)
    
    # Calcular hora máxima global para evitar forward fill de horas futuras
    if 'ejecutada_dt' in df.columns:
        global_max_hour = df['ejecutada_dt'].dropna().dt.hour.max()
    else:
        global_max_hour = float('nan')
    
    # Asegurar que tenemos fecha_operacional
    # Si hay múltiples fechas, el agrupamiento las separará, lo cual está bien.
    
    resultados = []
    
    # Agrupar por fecha, usuario (código SAP)
    grouped = df.groupby(['fecha_operacional', 'codigo_sap'])
    
    for name, group in grouped:
        fecha, sap = name
        
        # Obtener zona de la primera fila como referencia (aunque no se use para update)
        zona = group['zona_calculada'].iloc[0] if 'zona_calculada' in group.columns else 'Desconocida'
        
        # Validar si tiene datetime
        if 'ejecutada_dt' in group.columns:
            tiempos = group['ejecutada_dt'].dropna()
        else:
            tiempos = pd.Series([], dtype='datetime64[ns]')
            
        # Tiempos primer y ultimo corte
        # (Considerando actividades que suman al total de cortes Y reconexiones)
        movimientos_group = group[group['categoria'].isin(CATEGORIAS_TOTAL_CORTES | CATEGORIAS_RECONEXIONES)]
        if 'ejecutada_dt' in movimientos_group.columns:
            tiempos_movimientos = movimientos_group['ejecutada_dt'].dropna()
            primer_corte = tiempos_movimientos.min().time() if not tiempos_movimientos.empty else None
            ultimo_corte = tiempos_movimientos.max().time() if not tiempos_movimientos.empty else None
        else:
            primer_corte = None
            ultimo_corte = None
            
        # Calcular group y tiempos especificos para cortes
        cortes_group = group[group['categoria'].isin(CATEGORIAS_TOTAL_CORTES)]
        tiempos_cortes = cortes_group['ejecutada_dt'].dropna() if 'ejecutada_dt' in cortes_group.columns else pd.Series([], dtype='datetime64[ns]')
            
        # Acumulados por hora (solo de cortes)
        acum_09 = acum_10 = acum_11 = acum_12 = acum_13 = acum_14 = None
        
        # Diccionario para mapear hora objetivo a la variable y lógica de llenado
        horas_objetivo = [9, 10, 11, 12, 13, 14]
        acumulados_dict = {}
        
        for h in horas_objetivo:
            if pd.isna(global_max_hour) or h > global_max_hour + 1:
                acumulados_dict[h] = None
            else:
                if not tiempos_cortes.empty:
                    # Ejecutada < h:00 significa que la hora extraída (dt.hour) debe ser < h
                    acumulados_dict[h] = len(tiempos_cortes[tiempos_cortes.dt.hour < h])
                else:
                    acumulados_dict[h] = 0
                    
        acum_09 = acumulados_dict[9]
        acum_10 = acumulados_dict[10]
        acum_11 = acumulados_dict[11]
        acum_12 = acumulados_dict[12]
        acum_13 = acumulados_dict[13]
        acum_14 = acumulados_dict[14]

        kpis = {
            'fecha_operacional': fecha,
            'zona': zona,
            'codigo_sap': sap,
            'reconexiones_ejecutadas': len(group[group['categoria'].isin(CATEGORIAS_RECONEXIONES)]),
            'primer_corte': primer_corte,
            'ultimo_corte': ultimo_corte,
            'acum_09': acum_09,
            'acum_10': acum_10,
            'acum_11': acum_11,
            'acum_12': acum_12,
            'acum_13': acum_13,
            'acum_14': acum_14,
            'total_cortes': len(cortes_group),
            'corte_en_poste': len(group[group['categoria'] == 'corte_poste']),
            'corte_en_empalme': len(group[group['categoria'].isin(['corte_empalme', 'desmantelamiento'])]), # Se suma desmantelamiento por regla histórica a menos que se cambie
            'corte_fuera_de_rango': len(group[group['categoria'] == 'corte_fuera_de_rango']),
            'visita_fallida': len(group[group['categoria'] == 'fallida'])
        }
        
        resultados.append(kpis)
        
    return pd.DataFrame(resultados)
