"""Application configuration settings for MedGuard."""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "MedGuard - Medication Safety Intelligence"
    TAGLINE: str = "Every Prescription Deserves a Second Look"
    HACKATHON: str = "TalentAP Mega Hackathon 2026 – Healthcare Problem H4"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api"
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # Database configuration (SQLite initial foundation)
    DATABASE_URL: str = "sqlite:///./medguard.db"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
