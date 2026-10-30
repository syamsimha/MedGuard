"""API routes package for MedGuard."""
from .health import router as health_router
from .safety import router as safety_router
from .patients import router as patients_router
from .medications import router as medications_router
from .prescriptions import router as prescriptions_router

__all__ = [
    "health_router",
    "safety_router",
    "patients_router",
    "medications_router",
    "prescriptions_router",
]
