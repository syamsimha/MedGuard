"""MedGuard FastAPI Application Entrypoint."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.routes import (
    health_router,
    safety_router,
    patients_router,
    medications_router,
    prescriptions_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes and verifies relational database tables on server startup."""
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Medication Safety Intelligence API for TalentAP Mega Hackathon 2026 (Healthcare Problem H4)",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS for decoupled frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers: accessible at both /api/... and root for proxy compatibility
app.include_router(health_router, prefix="/api")
app.include_router(health_router)
app.include_router(safety_router, prefix="/api")
app.include_router(safety_router)
app.include_router(patients_router, prefix="/api")
app.include_router(patients_router)
app.include_router(medications_router, prefix="/api")
app.include_router(medications_router)
app.include_router(prescriptions_router, prefix="/api")
app.include_router(prescriptions_router)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint returning basic service metadata."""
    return {
        "service": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/docs",
        "health": "/api/health",
        "safety_check": "/api/safety/check",
        "patients": "/api/patients",
        "medications": "/api/medications",
        "prescriptions": "/api/prescriptions",
        "safety_alerts": "/api/safety/alerts",
        "audit_logs": "/api/safety/audit-logs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
