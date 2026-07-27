from fastapi import FastAPI
from contextlib import asynccontextmanager
from starlette.middleware.cors import CORSMiddleware
import os

from server.database import init_db, seed_data, SessionLocal
from server.api.endpoints import router as banking_router
from server.utils.broker import broker


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database and seed data on startup
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    # Connect event broker
    await broker.connect()
    yield


app = FastAPI(
    title="ApexBank Core Online Banking API",
    description="Secure, scalable, and regulatorily compliant online banking platform API.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security Headers Middleware (Enforces HTTPS/TLS and secure browser behavior)
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


# Include routers
app.include_router(banking_router)


@app.get("/health")
def health_check():
    return {"status": "healthy"}
