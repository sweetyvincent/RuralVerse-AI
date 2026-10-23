import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db
from app.api import (
    auth,
    admin,
    lessons,
    quizzes,
    experiments,
    air_writing,
    ai_tutor,
    students,
    teachers,
    analytics,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ruralverse")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and bootstrap admin if env vars are present
    logger.info("Initializing database...")
    init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield
    logger.info("Application shutting down...")


app = FastAPI(
    title="RuralVerse AI Backend API",
    description="Multilingual AI-Powered Rural Education Platform with Air-Writing, AR Science Lab, and RAG",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static resource access
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(lessons.router, prefix="/api")
app.include_router(quizzes.router, prefix="/api")
app.include_router(experiments.router, prefix="/api")
app.include_router(air_writing.router, prefix="/api")
app.include_router(ai_tutor.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(teachers.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint confirming application and database connectivity."""
    return {
        "status": "healthy",
        "platform": "RuralVerse AI",
        "database": "connected",
        "ai_provider": settings.AI_MODEL_NAME,
    }
