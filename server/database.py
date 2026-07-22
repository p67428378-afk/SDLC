import uuid
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from server.config import settings

# For SQLite, we need check_same_thread=False
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

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
    # Create all tables
    Base.metadata.create_all(bind=engine)

def seed_data(db):
    from server.models import Product, PerformanceMetric, Scenario
    from datetime import date, datetime
    import json

    # Check if products already exist to ensure idempotency
    if db.query(Product).first() is not None:
        return

    # Seed Products
    products_data = [
        {"sku_id": "SKU-101", "name": "Lay's Classic", "brand": "National", "category": "Snacks"},
        {"sku_id": "SKU-205", "name": "Clover Valley Pretzels", "brand": "Private", "category": "Snacks"},
        {"sku_id": "SKU-108", "name": "Doritos Nacho", "brand": "National", "category": "Snacks"},
        {"sku_id": "SKU-210", "name": "CV Tortilla Chips", "brand": "Private", "category": "Snacks"},
        {"sku_id": "SKU-115", "name": "Cheetos Crunchy", "brand": "National", "category": "Snacks"},
        {"sku_id": "SKU-142", "name": "Pringles Original", "brand": "National", "category": "Snacks"},
        {"sku_id": "SKU-255", "name": "CV Cheese Curls", "brand": "Private", "category": "Snacks"},
        {"sku_id": "SKU-301", "name": "CV Kettle Chips", "brand": "Private", "category": "Snacks"},
    ]

    products_map = {}
    for p in products_data:
        prod = Product(
            id=uuid.uuid4(),
            sku_id=p["sku_id"],
            name=p["name"],
            brand=p["brand"],
            category=p["category"]
        )
        db.add(prod)
        products_map[p["sku_id"]] = prod

    db.commit()

    # Seed Performance Metrics
    metrics_data = [
        {"sku_id": "SKU-101", "sales": 4250.0, "units_sold": 1200, "profit_margin": 0.24, "in_stock_rate": 0.98},
        {"sku_id": "SKU-205", "sales": 1800.0, "units_sold": 850, "profit_margin": 0.38, "in_stock_rate": 0.95},
        {"sku_id": "SKU-108", "sales": 3900.0, "units_sold": 1100, "profit_margin": 0.22, "in_stock_rate": 0.97},
        {"sku_id": "SKU-210", "sales": 2100.0, "units_sold": 920, "profit_margin": 0.36, "in_stock_rate": 0.96},
        {"sku_id": "SKU-115", "sales": 3500.0, "units_sold": 1050, "profit_margin": 0.23, "in_stock_rate": 0.98},
        {"sku_id": "SKU-142", "sales": 1200.0, "units_sold": 400, "profit_margin": 0.20, "in_stock_rate": 0.92},
        {"sku_id": "SKU-255", "sales": 800.0, "units_sold": 300, "profit_margin": 0.30, "in_stock_rate": 0.85},
        {"sku_id": "SKU-301", "sales": 0.0, "units_sold": 0, "profit_margin": 0.40, "in_stock_rate": 1.00}, # New product
    ]

    for m in metrics_data:
        prod = products_map[m["sku_id"]]
        metric = PerformanceMetric(
            id=uuid.uuid4(),
            product_id=prod.id,
            date=date(2026, 1, 15),
            sales=m["sales"],
            units_sold=m["units_sold"],
            profit_margin=m["profit_margin"],
            in_stock_rate=m["in_stock_rate"]
        )
        db.add(metric)

    # Seed Scenarios
    scenarios_data = [
        {
            "name": "conservative",
            "description": "Conservative scenario focusing on low risk and stable performance.",
            "rules": {
                "projected_sales_lift": 1.2,
                "shelf_capacity": 85,
                "private_brand_mix": 21.0,
                "in_stock_rate": 95.5,
                "sku_actions": [
                    {"sku_id": "SKU-101", "action": "MAINTAIN"},
                    {"sku_id": "SKU-205", "action": "MAINTAIN"},
                    {"sku_id": "SKU-108", "action": "MAINTAIN"},
                    {"sku_id": "SKU-210", "action": "MAINTAIN"},
                    {"sku_id": "SKU-115", "action": "MAINTAIN"},
                    {"sku_id": "SKU-142", "action": "MAINTAIN"},
                    {"sku_id": "SKU-255", "action": "MAINTAIN"},
                ]
            }
        },
        {
            "name": "balanced",
            "description": "Balanced scenario optimizing sales lift, shelf capacity, and private brand goals.",
            "rules": {
                "projected_sales_lift": 4.5,
                "shelf_capacity": 89,
                "private_brand_mix": 23.5,
                "in_stock_rate": 96.2,
                "sku_actions": [
                    {"sku_id": "SKU-101", "action": "GROW"},
                    {"sku_id": "SKU-205", "action": "MAINTAIN"},
                    {"sku_id": "SKU-108", "action": "GROW"},
                    {"sku_id": "SKU-210", "action": "MAINTAIN"},
                    {"sku_id": "SKU-115", "action": "GROW"},
                    {"sku_id": "SKU-142", "action": "SWAP"},
                    {"sku_id": "SKU-255", "action": "REDUCE"},
                    {"sku_id": "SKU-301", "action": "ADD"},
                ]
            }
        },
        {
            "name": "aggressive",
            "description": "Aggressive scenario maximizing sales lift but potentially violating guardrails.",
            "rules": {
                "projected_sales_lift": 8.1,
                "shelf_capacity": 94,
                "private_brand_mix": 19.5, # Violates private brand mix guardrail (< 20%)
                "in_stock_rate": 97.0,
                "sku_actions": [
                    {"sku_id": "SKU-101", "action": "GROW"},
                    {"sku_id": "SKU-205", "action": "REDUCE"},
                    {"sku_id": "SKU-108", "action": "GROW"},
                    {"sku_id": "SKU-210", "action": "REDUCE"},
                    {"sku_id": "SKU-115", "action": "GROW"},
                    {"sku_id": "SKU-142", "action": "GROW"},
                    {"sku_id": "SKU-255", "action": "REDUCE"},
                ]
            }
        }
    ]

    for s in scenarios_data:
        scen = Scenario(
            id=uuid.uuid4(),
            name=s["name"],
            description=s["description"],
            rules=s["rules"]
        )
        db.add(scen)

    db.commit()
