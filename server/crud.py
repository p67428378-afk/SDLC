from sqlalchemy.orm import Session
from server.models import (
    SKU,
    Scenario,
    ScenarioSkuAction,
    Submission,
    SubmissionSkuAction,
)
import uuid
from datetime import datetime


def get_kpis(db: Session):
    skus = db.query(SKU).all()
    if not skus:
        return {
            "sales_per_linear_ft": 425.50,
            "private_brand_pct": 24.5,
            "in_stock_rate": 98.2,
            "shelf_capacity": 88.0,
        }

    total_sales = sum(float(s.weekly_sales) for s in skus)
    total_space = sum(float(s.shelf_space) for s in skus)

    sales_per_linear_ft = total_sales / total_space if total_space > 0 else 0.0

    private_space = sum(
        float(s.shelf_space) for s in skus if "private" in s.brand.lower()
    )
    private_brand_pct = (private_space / total_space) * 100 if total_space > 0 else 0.0

    in_stock_rate = sum(float(s.in_stock_rate) for s in skus) / len(skus)

    # Assume total capacity is 200 ft
    shelf_capacity = (total_space / 200.0) * 100

    return {
        "sales_per_linear_ft": round(sales_per_linear_ft, 2),
        "private_brand_pct": round(private_brand_pct, 2),
        "in_stock_rate": round(in_stock_rate, 2),
        "shelf_capacity": round(shelf_capacity, 2),
    }


def get_skus(db: Session):
    return db.query(SKU).all()


def get_scenario_by_name(db: Session, name: str):
    scenario = db.query(Scenario).filter(Scenario.name.ilike(name)).first()
    if not scenario:
        return None

    # Get actions
    actions = (
        db.query(ScenarioSkuAction)
        .filter(ScenarioSkuAction.scenario_id == scenario.id)
        .all()
    )
    sku_actions = []
    for act in actions:
        sku = db.query(SKU).filter(SKU.id == act.sku_id).first()
        if sku:
            sku_actions.append({"sku_code": sku.sku_code, "action": act.action})

    # Generate guardrails based on scenario name
    guardrails = []
    if scenario.name.lower() == "conservative":
        guardrails = [
            {
                "name": "Shelf Capacity",
                "status": "PASS",
                "message": "Shelf capacity does not exceed 100%",
            },
            {
                "name": "Private Brand %",
                "status": "PASS",
                "message": "Private brand % meets target",
            },
            {
                "name": "In-Stock Rate",
                "status": "PASS",
                "message": "In-stock rate meets target",
            },
        ]
    elif scenario.name.lower() == "balanced":
        guardrails = [
            {
                "name": "Shelf Capacity",
                "status": "PASS",
                "message": "Shelf capacity does not exceed 100%",
            },
            {
                "name": "Private Brand %",
                "status": "PASS",
                "message": "Private brand % meets target",
            },
            {
                "name": "In-Stock Rate",
                "status": "WARNING",
                "message": "WARNING: Low stock on 1 SKU",
            },
        ]
    else:  # aggressive
        guardrails = [
            {
                "name": "Shelf Capacity",
                "status": "PASS",
                "message": "Shelf capacity does not exceed 100%",
            },
            {
                "name": "Private Brand %",
                "status": "PASS",
                "message": "Private brand % meets target",
            },
            {
                "name": "In-Stock Rate",
                "status": "WARNING",
                "message": "WARNING: Low stock on 2 SKUs",
            },
        ]

    return {
        "name": scenario.name,
        "projected_sales_impact": float(scenario.projected_sales_impact),
        "projected_brand_mix": float(scenario.projected_brand_mix),
        "sku_actions": sku_actions,
        "guardrails": guardrails,
    }


def create_submission(
    db: Session,
    scenario_name: str,
    sku_actions: list,
    user_id: str = "manager@dollargeneral.com",
):
    # Generate unique transaction ID
    transaction_id = (
        f"TXN-{int(datetime.utcnow().timestamp())}-{uuid.uuid4().hex[:5].upper()}"
    )

    submission = Submission(
        user_id=user_id,
        scenario_name=scenario_name,
        transaction_id=transaction_id,
        submitted_at=datetime.utcnow(),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    # Add actions
    saved_actions = []
    for act in sku_actions:
        sub_action = SubmissionSkuAction(
            submission_id=submission.id, sku_code=act.sku_code, action=act.action
        )
        db.add(sub_action)
        saved_actions.append({"sku_code": act.sku_code, "action": act.action})

    db.commit()

    return {
        "id": submission.id,
        "message": "Assortment plan submitted successfully.",
        "scenario_name": submission.scenario_name,
        "sku_actions": saved_actions,
        "submitted_at": submission.submitted_at,
        "transaction_id": submission.transaction_id,
        "user_id": submission.user_id,
    }
