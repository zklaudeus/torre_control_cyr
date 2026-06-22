from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    usuario: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class CurrentUser(BaseModel):
    id: int
    usuario: str
    rol: str
    supervisor_id: Optional[int] = None
    activo: bool

    class Config:
        orm_mode = True
