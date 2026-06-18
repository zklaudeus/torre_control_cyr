"""
service.py — Orquestador del motor de limpieza.
"""

from typing import List, Any
from sqlalchemy.orm import Session
import logging

from app.schemas.procesamiento import ProcesamientoResultado
from .reader import leer_excels
from .normalizer import procesar as normalizar
from .classifier import clasificar_medidas
from .deduplicator import deduplicar
from .calculator import calcular_kpis
from .sap_mapper import cruzar_con_sap
from .repository import actualizar_resultados

logger = logging.getLogger(__name__)

def procesar_archivos_operacionales(db: Session, archivos: List[Any], fecha_op_forzada: str = None) -> ProcesamientoResultado:
    """
    Flujo principal:
    1. Lectura
    2. Normalización
    3. Clasificación
    4. Deduplicación
    5. Cálculo de KPIs
    6. Cruce con BD (SAP)
    7. Actualización BD
    """
    # 1. Leer archivos
    df_unificado, meta_lectura = leer_excels(archivos)
    
    if df_unificado.empty:
        return ProcesamientoResultado(
            ok=False,
            fecha_operacional=fecha_op_forzada,
            total_filas_leidas=meta_lectura["total_filas_leidas"],
            total_filas_limpias=0,
            duplicados_eliminados=0,
            total_resultados_calculados=0,
            total_brigadas_actualizadas=0,
            usuarios_sin_sap=[],
            sap_sin_match=[],
            sap_duplicados=[],
            errores=meta_lectura.get("errores", ["No se pudieron leer filas."])
        )

    # 2. Normalizar
    df_norm = normalizar(df_unificado)
    
    # 2.1 Validar fecha operacional obligatoria desde Excel
    fechas_excel = df_norm['fecha_operacional'].dropna().unique().tolist()
    
    if not fechas_excel:
        return ProcesamientoResultado(
            ok=False,
            error="No se encontraron fechas válidas en la columna Ejecutada.",
            total_filas_leidas=meta_lectura["total_filas_leidas"],
            total_filas_limpias=0,
            duplicados_eliminados=0,
            total_resultados_calculados=0,
            total_brigadas_actualizadas=0
        )
        
    if len(fechas_excel) > 1:
        return ProcesamientoResultado(
            ok=False,
            error=f"Se detectaron múltiples fechas en los Excel operacionales: {fechas_excel}. Solo se permite procesar un día a la vez.",
            total_filas_leidas=meta_lectura["total_filas_leidas"],
            total_filas_limpias=0,
            duplicados_eliminados=0,
            total_resultados_calculados=0,
            total_brigadas_actualizadas=0
        )
        
    fecha_excel_str = str(fechas_excel[0])

    if fecha_op_forzada and fecha_op_forzada != fecha_excel_str:
        return ProcesamientoResultado(
            ok=False,
            error="La fecha seleccionada no coincide con la fecha operacional detectada en los Excel.",
            fecha_frontend=fecha_op_forzada,
            fecha_excel_detectada=fecha_excel_str,
            total_filas_leidas=meta_lectura["total_filas_leidas"],
            total_filas_limpias=0,
            duplicados_eliminados=0,
            total_resultados_calculados=0,
            total_brigadas_actualizadas=0
        )

    # La fecha oficial es la del Excel
    fecha_final = fecha_excel_str

    # 3. Clasificar
    df_clasificado = clasificar_medidas(df_norm)

    # 4. Deduplicar
    df_limpio, duplicados_eliminados = deduplicar(df_clasificado)

    # 5. Calcular KPIs
    df_kpis = calcular_kpis(df_limpio)
    
    # 6. Cruce SAP
    df_final, sin_sap, sap_sin_match, sap_duplicados = cruzar_con_sap(db, df_kpis)

    # 7. Actualización BD
    total_actualizadas = 0
    if not df_final.empty:
        print("====== DF FINAL a ACTUALIZAR ======")
        print(df_final[['codigo_sap', 'total_cortes', 'reconexiones_ejecutadas']].head(10).to_string())
        total_actualizadas = actualizar_resultados(db, df_final)

    return ProcesamientoResultado(
        ok=True,
        fecha_operacional=fecha_final,
        total_filas_leidas=meta_lectura["total_filas_leidas"],
        total_filas_limpias=len(df_limpio),
        duplicados_eliminados=duplicados_eliminados,
        total_resultados_calculados=len(df_kpis),
        total_brigadas_actualizadas=total_actualizadas,
        usuarios_sin_sap=sin_sap,
        sap_sin_match=sap_sin_match,
        sap_duplicados=sap_duplicados,
        errores=meta_lectura.get("errores", [])
    )
