from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.procesamiento import ProcesamientoResultado
from app.cleaning_engine.service import procesar_archivos_operacionales

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser

router = APIRouter()

@router.post("/actualizar-resultados-brigadas", response_model=ProcesamientoResultado)
async def actualizar_resultados_brigadas(
    files: List[UploadFile] = File(...),
    fecha_operacional: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    if current_user.rol == 'gerencia':
        raise HTTPException(status_code=403, detail="No tiene permisos para procesar archivos")
    """
    Recibe archivos Excel operacionales, limpia los datos, calcula KPIs 
    y actualiza control_brigadas_diario.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No se enviaron archivos")
        
    try:
        resultado = procesar_archivos_operacionales(db, files, fecha_op_forzada=fecha_operacional)
        return resultado
    except Exception as e:
        # En caso de error general, retornar el esquema con ok=False
        import logging
        logging.error(f"Error procesando archivos: {e}")
        return ProcesamientoResultado(
            ok=False,
            fecha_operacional=fecha_operacional,
            total_filas_leidas=0,
            total_filas_limpias=0,
            duplicados_eliminados=0,
            total_resultados_calculados=0,
            total_brigadas_actualizadas=0,
            usuarios_sin_sap=[],
            sap_sin_match=[],
            sap_duplicados=[],
            errores=[str(e)]
        )
