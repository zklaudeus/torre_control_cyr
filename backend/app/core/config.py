import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ensure .env is loaded into os.environ before accessing SECRET_KEY
load_dotenv()

class Settings(BaseSettings):
    APP_NAME: str = "Torre Control CYR EISESA API"
    APP_ENV: str = "development"
    DATABASE_URL: str = ""
    FRONTEND_URL: str = "http://localhost:5173"

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def SECRET_KEY(self) -> str:
        key = os.environ.get("SECRET_KEY")
        if not key:
            raise RuntimeError(
                "SECRET_KEY no está configurada. "
                "Defínela en backend/.env como SECRET_KEY=<valor> "
                "o ejecuta: python backend/scripts/ensure_local_secret.py"
            )
        return key

settings = Settings()
