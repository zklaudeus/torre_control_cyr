from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.configuracion import ConfiguracionCompleta
from app.repositories.configuracion_repository import ConfiguracionRepository

router = APIRouter()
repo = ConfiguracionRepository()

@router.get("", response_model=ConfiguracionCompleta, include_in_schema=False)
@router.get("/", response_model=ConfiguracionCompleta)
def get_configuracion(db: Session = Depends(get_db)):
    """
    Obtiene toda la configuración (parámetros generales, automatización, zonas PXQ y zonas CF).
    """
    return repo.get_configuracion(db)

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser
from fastapi import HTTPException

@router.post("", include_in_schema=False)
@router.post("/")
def save_configuracion(
    config: ConfiguracionCompleta, 
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Actualiza la configuración (parámetros generales, automatización, zonas PXQ y zonas CF).
    """
    if current_user.rol == 'gerencia':
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar la configuración")
    repo.save_configuracion(db, config)
    return {"status": "success"}
