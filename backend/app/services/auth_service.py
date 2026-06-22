from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import verify_password, create_access_token
from app.repositories.usuario_repository import get_user_by_username
from app.schemas.auth import LoginRequest, TokenResponse

def authenticate_user(db: Session, login_data: LoginRequest) -> TokenResponse:
    user = get_user_by_username(db, login_data.usuario)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
        
    access_token = create_access_token(
        data={
            "sub": user.usuario,
            "rol": user.rol,
            "supervisor_id": user.supervisor_id
        }
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "usuario": user.usuario,
            "rol": user.rol,
            "supervisor_id": user.supervisor_id
        }
    )
