"""MedGuard FastAPI Application Entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import health

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Medication Safety Intelligence API for TalentAP Mega Hackathon 2026 (Healthcare Problem H4)",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for decoupled frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers: accessible at both /api/health and /health
app.include_router(health.router, prefix="/api")
app.include_router(health.router)

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint returning basic service metadata."""
    return {
        "service": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
