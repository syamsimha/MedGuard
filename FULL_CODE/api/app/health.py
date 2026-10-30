"""Health check endpoint definition for MedGuard API."""
from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health", summary="Health check endpoint")
def health_check():
    """Returns the operational status of the MedGuard API."""
    return {
        "status": "healthy",
        "application": "MedGuard"
    }
