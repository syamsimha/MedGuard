"""Database models export for database scripts and migrations."""
import sys
from pathlib import Path

# Ensure api directory is in sys.path
API_DIR = Path(__file__).resolve().parent.parent / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.models.db_models import (
    Patient,
    Medication,
    Prescription,
    SafetyAlert,
    SafetyAuditLog,
)
from app.core.database import Base, engine, SessionLocal, init_db, get_db

__all__ = [
    "Patient",
    "Medication",
    "Prescription",
    "SafetyAlert",
    "SafetyAuditLog",
    "Base",
    "engine",
    "SessionLocal",
    "init_db",
    "get_db",
]

