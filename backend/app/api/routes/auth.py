from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, CurrentUser
from app.services.auth_service import authenticate_user
from app.core.security import get_current_user

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Autenticar usuario y retornar token JWT.
    """
    return authenticate_user(db, login_data)

@router.get("/me", response_model=CurrentUser)
def get_me(current_user = Depends(get_current_user)):
    """
    Obtener el usuario actual a partir del token JWT.
    """
    return current_user
