"""Database initialization and migration utility for MedGuard."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Ensure api directory is in sys.path
DB_DIR = Path(__file__).resolve().parent
ROOT_DIR = DB_DIR.parent
API_DIR = ROOT_DIR / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models.db_models import (
    Patient,
    Medication,
    Prescription,
    SafetyAlert,
    SafetyAuditLog,
)


def initialize_database(reset: bool = False) -> None:
    """Creates all database tables using SQLAlchemy models."""
    print(f"Target Database URL: {settings.DATABASE_URL}")
    if reset:
        print("Warning: Reset requested. Dropping all existing tables...")
        Base.metadata.drop_all(bind=engine)
        print("All tables dropped.")

    print("Creating all database tables (patients, medications, prescriptions, safety_alerts, safety_audit_logs)...")
    Base.metadata.create_all(bind=engine)
    print("Database schema successfully initialized and verified.")


def main():
    parser = argparse.ArgumentParser(description="MedGuard Database Initialization")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop and recreate all database tables (destructive)",
    )
    args = parser.parse_args()
    initialize_database(reset=args.reset)


if __name__ == "__main__":
    main()
