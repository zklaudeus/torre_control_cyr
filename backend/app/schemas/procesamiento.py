from pydantic import BaseModel
from typing import List, Optional

class ProcesamientoResultado(BaseModel):
    ok: bool
    fecha_operacional: Optional[str]
    total_filas_leidas: int
    total_filas_limpias: int
    duplicados_eliminados: int
    total_resultados_calculados: int
    total_brigadas_actualizadas: int
    usuarios_sin_sap: List[str] = []
    sap_sin_match: List[str] = []
    sap_duplicados: List[str] = []
    errores: List[str] = []
    error: Optional[str] = None
    fecha_frontend: Optional[str] = None
    fecha_excel_detectada: Optional[str] = None
