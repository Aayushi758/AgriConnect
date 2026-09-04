"""AgriConnect - Direct Farmer-to-Consumer Agricultural Marketplace.

FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import get_settings
from app.database import create_tables, get_db, SessionLocal
from app.routers.auth import router as auth_router
from app.routers.products import router as products_router
from app.routers.api_routes import (
    orders_router, inventory_router, dashboard_router,
    delivery_router, chat_router, support_router,
    ai_router, weather_router,
)

settings = get_settings()

app = FastAPI(
    title="AgriConnect API",
    description=(
        "Direct Farmer-to-Consumer Agricultural Marketplace API. "
        "Smart India Hackathon - PS 26033."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for serving product images
uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Include routers
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(orders_router)
app.include_router(inventory_router)
app.include_router(dashboard_router)
app.include_router(delivery_router)
app.include_router(chat_router)
app.include_router(support_router)
app.include_router(ai_router)
app.include_router(weather_router)


@app.on_event("startup")
def startup():
    """Create tables and optionally seed on startup."""
    # Import all models to register them
    import app.models  # noqa: F401
    create_tables()


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": "AgriConnect", "version": "1.0.0"}


@app.post("/api/seed")
def seed_database():
    """Seed database with demo data. Only works if DB is empty."""
    from app.seed.seed_data import seed_database as run_seed
    db = SessionLocal()
    try:
        result = run_seed(db)
        return result
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "message": "Welcome to AgriConnect API",
        "docs": "/api/docs",
        "health": "/api/health",
    }
