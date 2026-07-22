import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from server.config import settings

# Check if we are testing
IS_TESTING = os.getenv("TESTING", "false").lower() == "true"

if IS_TESTING:
    DATABASE_URL = "sqlite:///:memory:"
    from sqlalchemy.pool import StaticPool

    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    DATABASE_URL = settings.DATABASE_URL
    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False},
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
    # Import models to register them on Base.metadata
    Base.metadata.create_all(bind=engine)

    # Seed data
    db = SessionLocal()
    try:
        from server.seed import seed_data

        seed_data(db)
    finally:
        db.close()
