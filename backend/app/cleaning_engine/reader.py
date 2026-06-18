"""
reader.py — Lectura de archivos Excel operacionales.

Lee uno o más archivos .xlsx/.xls desde UploadFile (FastAPI) en memoria,
sin guardarlos a disco permanentemente.
Rechaza archivos con prefijos inválidos.
Devuelve DataFrame unificado + metadatos de lectura.
"""

import io
import logging
from typing import List, Tuple

import pandas as pd

logger = logging.getLogger(__name__)

# Prefijos de nombre de archivo que deben ignorarse
PREFIJOS_INVALIDOS = ("~$", "reporte_", "historico_", "base_")

# Extensiones aceptadas
EXTENSIONES_VALIDAS = (".xlsx", ".xls")


def es_archivo_valido(nombre: str) -> bool:
    """Retorna True si el nombre de archivo es procesable."""
    nombre_lower = nombre.lower()
    if any(nombre_lower.startswith(p) for p in PREFIJOS_INVALIDOS):
        return False
    if not any(nombre_lower.endswith(ext) for ext in EXTENSIONES_VALIDAS):
        return False
    return True


def leer_excels(archivos: list) -> Tuple[pd.DataFrame, dict]:
    """
    Lee una lista de objetos con .filename y .file (UploadFile-like),
    o rutas de archivo (str/Path) para testing.

    Retorna:
        df_unificado: DataFrame con todas las filas combinadas
        meta: diccionario con metadatos de la operación
    """
    dfs = []
    archivos_procesados = []
    archivos_ignorados = []
    errores = []

    for archivo in archivos:
        # Soporte para UploadFile (FastAPI) y rutas de string (tests)
        if isinstance(archivo, str):
            nombre = archivo.split("/")[-1].split("\\")[-1]
            if not es_archivo_valido(nombre):
                archivos_ignorados.append(nombre)
                continue
            try:
                df = pd.read_excel(archivo, sheet_name=0)
                df["_archivo_origen"] = nombre
                dfs.append(df)
                archivos_procesados.append(nombre)
                logger.info(f"Leído '{nombre}': {len(df)} filas")
            except Exception as e:
                errores.append(f"Error leyendo '{nombre}': {str(e)}")
                logger.error(f"Error leyendo '{nombre}': {e}")
        else:
            # UploadFile de FastAPI
            nombre = archivo.filename
            if not es_archivo_valido(nombre):
                archivos_ignorados.append(nombre)
                continue
            try:
                contenido = archivo.file.read()
                df = pd.read_excel(io.BytesIO(contenido), sheet_name=0)
                df["_archivo_origen"] = nombre
                dfs.append(df)
                archivos_procesados.append(nombre)
                logger.info(f"Leído '{nombre}': {len(df)} filas")
            except Exception as e:
                errores.append(f"Error leyendo '{nombre}': {str(e)}")
                logger.error(f"Error leyendo '{nombre}': {e}")

    if not dfs:
        meta = {
            "archivos_procesados": archivos_procesados,
            "archivos_ignorados": archivos_ignorados,
            "total_filas_leidas": 0,
            "errores": errores or ["No se encontraron archivos válidos para procesar"],
        }
        return pd.DataFrame(), meta

    df_unificado = pd.concat(dfs, ignore_index=True)

    meta = {
        "archivos_procesados": archivos_procesados,
        "archivos_ignorados": archivos_ignorados,
        "total_filas_leidas": len(df_unificado),
        "errores": errores,
    }

    return df_unificado, meta
