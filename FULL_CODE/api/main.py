"""MedGuard API - Application Entrypoint.

TalentAP Mega Hackathon 2026 - Healthcare Problem H4
MedGuard: Medication Safety Intelligence
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.health import router as health_router
from app.routes.safety import router as safety_router
from app.routes.patients import router as patients_router
from app.routes.medications import router as medications_router
from app.routes.prescriptions import router as prescriptions_router
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensures database tables are initialized and verified on application startup."""
    init_db()
    yield


app = FastAPI(
    title="MedGuard API",
    description="Clinical Medication Safety Intelligence Backend API with Relational Clinical Datastore",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS for local development with Vite frontend (localhost:5173)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount health routes (accessible at /health and /api/health for frontend proxy compatibility)
app.include_router(health_router)
app.include_router(health_router, prefix="/api")

# Mount clinical safety engine routes
app.include_router(safety_router)
app.include_router(safety_router, prefix="/api")

# Mount patient clinical demographic CRUD routes
app.include_router(patients_router)
app.include_router(patients_router, prefix="/api")

# Mount medication formulary CRUD routes
app.include_router(medications_router)
app.include_router(medications_router, prefix="/api")

# Mount prescription creation, evaluation, and review routes
app.include_router(prescriptions_router)
app.include_router(prescriptions_router, prefix="/api")


@app.get("/", tags=["Root"])
def root():
    """Welcome endpoint for MedGuard API."""
    return {
        "message": "Welcome to MedGuard API – Medication Safety Intelligence",
        "tagline": "Every Prescription Deserves a Second Look",
        "status": "operational",
        "version": "0.2.0",
        "docs": "/docs",
        "health": "/health",
        "safety_check": "/api/safety/check",
        "patients": "/api/patients",
        "medications": "/api/medications",
        "prescriptions": "/api/prescriptions",
        "safety_alerts": "/api/safety/alerts",
        "audit_logs": "/api/safety/audit-logs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
