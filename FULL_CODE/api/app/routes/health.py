"""Health check endpoint for MedGuard API."""
from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="", tags=["Health"])

@router.get("/health", summary="System Health Status")
async def health_check():
    """Returns the operational status of the MedGuard API services."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "hackathon": settings.HACKATHON,
        "version": settings.VERSION,
        "stage": "Phase 1: Project foundation",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "type": "sqlite",
            "status": "ready"
        }
    }
