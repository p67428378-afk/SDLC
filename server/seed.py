from sqlalchemy.orm import Session
from server.models import SKU, Scenario, ScenarioSkuAction
from sqlalchemy.exc import IntegrityError


def seed_data(db: Session):
    # Seed SKUs
    skus_data = [
        {
            "sku_code": "SKU-1001",
            "name": "Clover Valley Potato Chips",
            "brand": "Private Brand",
            "weekly_sales": 1250.00,
            "units_sold": 500,
            "profit_margin": 45.00,
            "shelf_space": 4.00,
            "in_stock_rate": 98.20,
            "status": "GROW",
        },
        {
            "sku_code": "SKU-1002",
            "name": "Lay's Classic Potato Chips",
            "brand": "National Brand",
            "weekly_sales": 2400.00,
            "units_sold": 800,
            "profit_margin": 30.00,
            "shelf_space": 6.00,
            "in_stock_rate": 97.50,
            "status": "MAINTAIN",
        },
        {
            "sku_code": "SKU-1003",
            "name": "Clover Valley Pretzels",
            "brand": "Private Brand",
            "weekly_sales": 450.00,
            "units_sold": 200,
            "profit_margin": 40.00,
            "shelf_space": 3.00,
            "in_stock_rate": 99.00,
            "status": "GROW",
        },
        {
            "sku_code": "SKU-1004",
            "name": "Cheetos Crunchy",
            "brand": "National Brand",
            "weekly_sales": 1850.00,
            "units_sold": 600,
            "profit_margin": 35.00,
            "shelf_space": 5.00,
            "in_stock_rate": 98.50,
            "status": "MAINTAIN",
        },
        {
            "sku_code": "SKU-1005",
            "name": "Doritos Nacho Cheese",
            "brand": "National Brand",
            "weekly_sales": 950.00,
            "units_sold": 300,
            "profit_margin": 32.00,
            "shelf_space": 4.00,
            "in_stock_rate": 96.00,
            "status": "SWAP",
        },
        {
            "sku_code": "SKU-1006",
            "name": "Clover Valley Tortilla Chips",
            "brand": "Private Brand",
            "weekly_sales": 300.00,
            "units_sold": 120,
            "profit_margin": 42.00,
            "shelf_space": 2.00,
            "in_stock_rate": 95.00,
            "status": "REDUCE",
        },
    ]

    sku_map = {}
    for s_data in skus_data:
        existing_sku = db.query(SKU).filter(SKU.sku_code == s_data["sku_code"]).first()
        if not existing_sku:
            sku = SKU(**s_data)
            db.add(sku)
            try:
                db.commit()
                db.refresh(sku)
                sku_map[sku.sku_code] = sku
            except IntegrityError:
                db.rollback()
                sku = db.query(SKU).filter(SKU.sku_code == s_data["sku_code"]).first()
                sku_map[sku.sku_code] = sku
        else:
            sku_map[existing_sku.sku_code] = existing_sku

    # Seed Scenarios
    scenarios_data = [
        {
            "name": "Conservative",
            "projected_sales_impact": 1.20,
            "projected_brand_mix": 24.80,
            "actions": {
                "SKU-1001": "GROW",
                "SKU-1002": "MAINTAIN",
                "SKU-1003": "GROW",
                "SKU-1004": "MAINTAIN",
                "SKU-1005": "MAINTAIN",
                "SKU-1006": "REDUCE",
            },
        },
        {
            "name": "Balanced",
            "projected_sales_impact": 3.50,
            "projected_brand_mix": 25.20,
            "actions": {
                "SKU-1001": "GROW",
                "SKU-1002": "MAINTAIN",
                "SKU-1003": "GROW",
                "SKU-1004": "MAINTAIN",
                "SKU-1005": "SWAP",
                "SKU-1006": "REDUCE",
            },
        },
        {
            "name": "Aggressive",
            "projected_sales_impact": 5.80,
            "projected_brand_mix": 26.00,
            "actions": {
                "SKU-1001": "GROW",
                "SKU-1002": "REDUCE",
                "SKU-1003": "GROW",
                "SKU-1004": "MAINTAIN",
                "SKU-1005": "SWAP",
                "SKU-1006": "REDUCE",
            },
        },
    ]

    for sc_data in scenarios_data:
        existing_sc = (
            db.query(Scenario).filter(Scenario.name == sc_data["name"]).first()
        )
        if not existing_sc:
            sc = Scenario(
                name=sc_data["name"],
                projected_sales_impact=sc_data["projected_sales_impact"],
                projected_brand_mix=sc_data["projected_brand_mix"],
            )
            db.add(sc)
            try:
                db.commit()
                db.refresh(sc)
            except IntegrityError:
                db.rollback()
                sc = db.query(Scenario).filter(Scenario.name == sc_data["name"]).first()

            # Add actions
            for sku_code, action in sc_data["actions"].items():
                sku = sku_map.get(sku_code)
                if sku:
                    act = ScenarioSkuAction(
                        scenario_id=sc.id, sku_id=sku.id, action=action
                    )
                    db.add(act)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
