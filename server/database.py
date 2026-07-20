import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from server.config import settings

# For SQLite, we need connect_args={"check_same_thread": False}
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import models here to ensure they are registered on Base.metadata
    from server import models
    Base.metadata.create_all(bind=engine)

def seed_data(db):
    from server.models import SKU
    import uuid

    # Check if SKUs already exist
    if db.query(SKU).count() > 0:
        return

    # Seed initial SKUs
    initial_skus = [
        {
            "id": uuid.UUID("d3b07384-d113-49c6-a5e6-84287a5a5f01"),
            "name": "Classic Potato Chips 10oz",
            "category": "Snacks",
            "private_brand": True,
            "sales": 15240.5,
            "sales_growth_pct": 4.5,
            "units_sold": 5000,
            "gross_margin_pct": 35.0,
        },
        {
            "id": uuid.UUID("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c01"),
            "name": "Clover Valley Potato Chips 10oz",
            "category": "Snacks",
            "private_brand": True,
            "sales": 12450.0,
            "sales_growth_pct": 14.2,
            "units_sold": 4500,
            "gross_margin_pct": 35.0,
        },
        {
            "id": uuid.UUID("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c02"),
            "name": "Lay's Classic Potato Chips 8oz",
            "category": "Snacks",
            "private_brand": False,
            "sales": 18200.0,
            "sales_growth_pct": 2.1,
            "units_sold": 6000,
            "gross_margin_pct": 30.0,
        },
        {
            "id": uuid.UUID("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c03"),
            "name": "Clover Valley Pretzels 16oz",
            "category": "Snacks",
            "private_brand": True,
            "sales": 4100.0,
            "sales_growth_pct": -8.5,
            "units_sold": 2000,
            "gross_margin_pct": 28.0,
        },
        {
            "id": uuid.UUID("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c04"),
            "name": "Doritos Nacho Cheese 9.25oz",
            "category": "Snacks",
            "private_brand": False,
            "sales": 15600.0,
            "sales_growth_pct": 5.4,
            "units_sold": 5200,
            "gross_margin_pct": 32.0,
        },
        {
            "id": uuid.UUID("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c05"),
            "name": "Clover Valley Cheese Curls 7oz",
            "category": "Snacks",
            "private_brand": True,
            "sales": 3200.0,
            "sales_growth_pct": -12.4,
            "units_sold": 1500,
            "gross_margin_pct": 25.0,
        },
        {
            "id": uuid.UUID("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c06"),
            "name": "Pringles Sour Cream & Onion",
            "category": "Snacks",
            "private_brand": False,
            "sales": 8900.0,
            "sales_growth_pct": 0.8,
            "units_sold": 3500,
            "gross_margin_pct": 29.0,
        },
        {
            "id": uuid.UUID("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c07"),
            "name": "Clover Valley Tortilla Chips 12oz",
            "category": "Snacks",
            "private_brand": True,
            "sales": 9500.0,
            "sales_growth_pct": 6.2,
            "units_sold": 3800,
            "gross_margin_pct": 33.0,
        },
        {
            "id": uuid.UUID("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c08"),
            "name": "Tostitos Scoops 10oz",
            "category": "Snacks",
            "private_brand": False,
            "sales": 14200.0,
            "sales_growth_pct": 3.1,
            "units_sold": 4800,
            "gross_margin_pct": 31.0,
        },
        {
            "id": uuid.UUID("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c09"),
            "name": "Clover Valley Roasted Peanuts 16oz",
            "category": "Snacks",
            "private_brand": True,
            "sales": 5400.0,
            "sales_growth_pct": -2.5,
            "units_sold": 2200,
            "gross_margin_pct": 27.0,
        },
        {
            "id": uuid.UUID("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c10"),
            "name": "Cheetos Crunchy 8.5oz",
            "category": "Snacks",
            "private_brand": False,
            "sales": 16800.0,
            "sales_growth_pct": 7.8,
            "units_sold": 5500,
            "gross_margin_pct": 34.0,
        }
    ]

    for sku_data in initial_skus:
        sku = SKU(**sku_data)
        db.add(sku)
    
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
