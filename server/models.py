import uuid
import json
from sqlalchemy import Column, String, Integer, Boolean, Numeric, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import Session
from server.database import Base


class SKU(Base):
    __tablename__ = "skus"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sku_name = Column(Text, nullable=False)
    category = Column(Text, nullable=False, default="Snacks")
    weekly_sales = Column(Numeric, nullable=False, default=0.0)
    yoy_growth = Column(Numeric, nullable=False, default=0.0)
    profit_margin = Column(Numeric, nullable=False, default=0.0)
    inventory_level = Column(Integer, nullable=False, default=0)
    is_private_brand = Column(Boolean, nullable=False, default=False)
    status = Column(String, nullable=False, default="MAINTAIN")
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class AssortmentScenario(Base):
    __tablename__ = "assortment_scenarios"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(Text, nullable=False, unique=True)
    rules = Column(
        Text, nullable=False, default="{}"
    )  # Stored as JSON string for SQLite compatibility
    projected_sales_lift = Column(Numeric, nullable=False, default=0.0)
    projected_brand_mix = Column(Numeric, nullable=False, default=0.0)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class SubmissionAudit(Base):
    __tablename__ = "submission_audit"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Text, nullable=False)
    scenario_name = Column(Text, nullable=False)
    guardrails_passed = Column(Boolean, nullable=False, default=True)
    changes = Column(
        Text, nullable=False, default="[]"
    )  # Stored as JSON string for SQLite compatibility
    submitted_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


def seed_data(db: Session):
    # Seed SKUs if empty
    if db.query(SKU).count() == 0:
        skus = [
            SKU(
                sku_name="Clover Valley Potato Chips 10oz",
                category="Snacks",
                weekly_sales=1240.0,
                yoy_growth=12.4,
                profit_margin=38.5,
                inventory_level=420,
                is_private_brand=True,
                status="GROW",
            ),
            SKU(
                sku_name="Lays Classic Potato Chips 8oz",
                category="Snacks",
                weekly_sales=2150.0,
                yoy_growth=1.5,
                profit_margin=22.0,
                inventory_level=180,
                is_private_brand=False,
                status="MAINTAIN",
            ),
            SKU(
                sku_name="Clover Valley Pretzel Twists 16oz",
                category="Snacks",
                weekly_sales=450.0,
                yoy_growth=-8.2,
                profit_margin=41.0,
                inventory_level=310,
                is_private_brand=True,
                status="SWAP",
            ),
            SKU(
                sku_name="Brand X Cheese Puffs 6oz",
                category="Snacks",
                weekly_sales=180.0,
                yoy_growth=-15.4,
                profit_margin=15.0,
                inventory_level=45,
                is_private_brand=False,
                status="REDUCE",
            ),
        ]
        db.add_all(skus)
        db.commit()

    # Seed Scenarios if empty
    if db.query(AssortmentScenario).count() == 0:
        scenarios = [
            AssortmentScenario(
                name="Conservative",
                rules=json.dumps(
                    {
                        "actions": [
                            {
                                "action": "KEEP",
                                "sku_name": "Lays Classic Potato Chips 8oz",
                                "details": "Maintain current shelf space",
                            }
                        ]
                    }
                ),
                projected_sales_lift=1.2,
                projected_brand_mix=21.0,
            ),
            AssortmentScenario(
                name="Balanced",
                rules=json.dumps(
                    {
                        "actions": [
                            {
                                "action": "ADD",
                                "sku_name": "Clover Valley Spicy Nacho Chips 10oz",
                                "details": "+Proj. Sales $450/wk",
                            },
                            {
                                "action": "SWAP",
                                "sku_name": "Brand Y Pretzels for Clover Valley Pretzels",
                                "details": "Margin +4.2%",
                            },
                            {
                                "action": "REMOVE",
                                "sku_name": "Brand Z Cheese Puffs 6oz",
                                "details": "Frees 1.2 linear ft",
                            },
                        ]
                    }
                ),
                projected_sales_lift=3.8,
                projected_brand_mix=24.5,
            ),
            AssortmentScenario(
                name="Aggressive",
                rules=json.dumps(
                    {
                        "actions": [
                            {
                                "action": "ADD",
                                "sku_name": "Clover Valley Spicy Nacho Chips 10oz",
                                "details": "+Proj. Sales $450/wk",
                            },
                            {
                                "action": "ADD",
                                "sku_name": "Clover Valley Extreme Cheese Puffs 8oz",
                                "details": "+Proj. Sales $350/wk",
                            },
                            {
                                "action": "REMOVE",
                                "sku_name": "Brand X Cheese Puffs 6oz",
                                "details": "Frees 0.8 linear ft",
                            },
                            {
                                "action": "REMOVE",
                                "sku_name": "Lays Classic Potato Chips 8oz",
                                "details": "Frees 2.0 linear ft",
                            },
                        ]
                    }
                ),
                projected_sales_lift=6.5,
                projected_brand_mix=28.2,
            ),
        ]
        db.add_all(scenarios)
        db.commit()
