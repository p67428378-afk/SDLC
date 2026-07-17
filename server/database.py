import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# Check if we are running in a test environment
IS_TESTING = os.getenv("TESTING", "false").lower() == "true" or "pytest" in os.getenv(
    "PYTEST_CURRENT_TEST", ""
)

if IS_TESTING or DATABASE_URL.startswith("sqlite"):
    # Use SQLite in-memory or local file with StaticPool for tests/local dev
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
        if DATABASE_URL.startswith("sqlite")
        else {},
        poolclass=StaticPool if IS_TESTING else None,
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import models here to register them on Base.metadata
    from server import models

    Base.metadata.create_all(bind=engine)

    # Seed initial data
    db = SessionLocal()
    try:
        models.seed_data(db)
    finally:
        db.close()
