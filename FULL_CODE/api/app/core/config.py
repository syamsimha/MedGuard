"""Application configuration settings for MedGuard."""
import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

API_DIR = Path(__file__).resolve().parents[2]
FULL_CODE_DIR = API_DIR.parent
ENV_PATH = FULL_CODE_DIR / ".env"
DEFAULT_DB_FILE = (FULL_CODE_DIR / "db" / "medguard.db").resolve()

class Settings(BaseSettings):
    PROJECT_NAME: str = "MedGuard - Medication Safety Intelligence"
    TAGLINE: str = "Every Prescription Deserves a Second Look"
    HACKATHON: str = "TalentAP Mega Hackathon 2026 – Healthcare Problem H4"
    VERSION: str = "0.2.0"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api"
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # Database configuration (Defaults to FULL_CODE/db/medguard.db SQLite foundation)
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_FILE.as_posix()}"

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH) if ENV_PATH.exists() else ".env",
        case_sensitive=True,
        extra="allow",
    )

settings = Settings()
