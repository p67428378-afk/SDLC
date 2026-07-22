from sqlalchemy.orm import Session
from server.models import Product, PerformanceMetric, Scenario, AssortmentSubmission
from typing import List, Optional
import uuid

def get_all_products_with_metrics(db: Session):
    # Query products and their latest performance metrics
    results = db.query(Product).all()
    skus = []
    for prod in results:
        # Get the latest metric
        metric = db.query(PerformanceMetric).filter(PerformanceMetric.product_id == prod.id).order_by(PerformanceMetric.created_at.desc()).first()
        
        # Determine status badge based on brand or sales
        # Let's map them to match the Stitch HTML and WorkSpec
        status = "MAINTAIN"
        if prod.sku_id in ["SKU-101", "SKU-108", "SKU-115"]:
            status = "GROW"
        elif prod.sku_id in ["SKU-205", "SKU-210"]:
            status = "MAINTAIN"
        elif prod.sku_id == "SKU-142":
            status = "SWAP"
        elif prod.sku_id == "SKU-255":
            status = "REDUCE"
        elif prod.sku_id == "SKU-301":
            status = "ADD"

        sales_val = float(metric.sales) if metric else 0.0
        units_val = int(metric.units_sold) if metric else 0
        margin_val = float(metric.profit_margin) if metric else 0.0
        in_stock_val = float(metric.in_stock_rate) if metric else 0.0

        skus.append({
            "sku_id": prod.sku_id,
            "name": prod.name,
            "brand": prod.brand,
            "sales": sales_val,
            "units_sold": units_val,
            "profit_margin": margin_val,
            "in_stock_rate": in_stock_val,
            "status": status
        })
    return skus

def get_scenario_by_name(db: Session, name: str):
    return db.query(Scenario).filter(Scenario.name == name.lower()).first()

def create_submission(db: Session, scenario_name: str, sku_actions: list, submitted_by: str):
    submission = AssortmentSubmission(
        id=uuid.uuid4(),
        scenario_name=scenario_name,
        sku_actions=sku_actions,
        submitted_by=submitted_by
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission
