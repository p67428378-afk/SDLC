from typing import Optional
from sqlalchemy.orm import Session
from server import models


def get_kpis(db: Session):
    # Calculate KPIs dynamically or return standard baseline
    # Sales per linear ft: $342.50
    # Private Brand %: 24.5%
    # In-Stock Rate: 96.8%
    # Shelf Capacity: 88.2%
    # Sales Growth: 4.2%
    # Remaining linear ft: 8.2
    return {
        "sales_per_linear_ft": 342.50,
        "private_brand_percentage": 24.5,
        "in_stock_rate": 96.8,
        "shelf_capacity_percentage": 88.2,
        "sales_growth_percentage": 4.2,
        "remaining_linear_ft": 8.2,
    }


def get_skus(
    db: Session,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None,
):
    query = db.query(models.SKU)
    if search:
        query = query.filter(models.SKU.sku_name.ilike(f"%{search}%"))

    if sort_by:
        col = getattr(models.SKU, sort_by, None)
        if col:
            if sort_order == "desc":
                query = query.order_by(col.desc())
            else:
                query = query.order_by(col.asc())
    else:
        query = query.order_by(models.SKU.sku_name.asc())

    return query.all()
