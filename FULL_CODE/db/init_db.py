"""Database initialization utility for MedGuard SQLite foundation."""
import sqlite3
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent
DB_FILE = DB_DIR / "medguard.db"
SCHEMA_FILE = DB_DIR / "schema.sql"

def init_db(db_path: Path = DB_FILE, schema_path: Path = SCHEMA_FILE) -> bool:
    """Initializes the SQLite schema."""
    print(f"Initializing database at: {db_path}")
    conn = sqlite3.connect(db_path)
    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        conn.executescript(schema_sql)
        conn.commit()
        print("Database schema successfully initialized.")
        return True
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
