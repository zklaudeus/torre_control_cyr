import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Torre Control CYR EISESA API"
    APP_ENV: str = "development"
    DATABASE_URL: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    
    SECRET_KEY: str = "super-secret-key-torre-cyr-eisesa-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    class Config:
        env_file = ".env"

settings = Settings()
