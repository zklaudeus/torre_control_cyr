from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.configuracion import ConfiguracionCompleta
from app.repositories.configuracion_repository import ConfiguracionRepository

router = APIRouter()
repo = ConfiguracionRepository()

@router.get("/", response_model=ConfiguracionCompleta)
def get_configuracion(db: Session = Depends(get_db)):
    """
    Obtiene toda la configuración (parámetros generales, automatización, zonas PXQ y zonas CF).
    """
    return repo.get_configuracion(db)

@router.post("/")
def save_configuracion(config: ConfiguracionCompleta, db: Session = Depends(get_db)):
    """
    Actualiza la configuración (parámetros generales, automatización, zonas PXQ y zonas CF).
    """
    repo.save_configuracion(db, config)
    return {"status": "success"}
