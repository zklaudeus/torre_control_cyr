from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db, engine
from app.core.config import settings

router = APIRouter()

@router.get("/")
def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME
    }

@router.get("/db")
def health_check_db(db: Session = Depends(get_db)):
    if not settings.DATABASE_URL:
        return {
            "status": "warning",
            "message": "DATABASE_URL is not configured"
        }
    if db is None:
        return {
            "status": "error",
            "message": "Could not connect to the database"
        }
    return {
        "status": "ok",
        "message": "Database connection successful"
    }
