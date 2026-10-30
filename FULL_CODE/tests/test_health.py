"""Health check and root endpoint tests."""
import sys
from pathlib import Path

# Ensure api directory is in Python path for testing
API_DIR = Path(__file__).resolve().parent.parent / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    """Verify that /health responds with status healthy and application MedGuard."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["application"] == "MedGuard"

def test_api_health_endpoint():
    """Verify that /api/health also responds for proxy compatibility."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["application"] == "MedGuard"

def test_root_endpoint():
    """Verify that root endpoint responds with welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "MedGuard" in data["message"]
