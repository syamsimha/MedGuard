"""Health check endpoint tests."""
import sys
from pathlib import Path

# Ensure api directory is in Python path for testing
API_DIR = Path(__file__).resolve().parent.parent / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health_endpoint():
    """Verify that /api/health responds with 200 OK and healthy status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "MedGuard" in data["service"]
    assert data["version"] == "0.1.0"
    assert "timestamp" in data

def test_root_endpoint():
    """Verify that root endpoint responds with metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "service" in data
