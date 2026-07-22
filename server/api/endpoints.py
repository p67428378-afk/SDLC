from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from server.database import get_db
from server.schemas import (
    KpiResponse,
    SkuResponse,
    ScenarioResponse,
    SubmitRequest,
    SubmitResponse,
    Guardrails,
    SkuAction,
)
from server.crud import (
    get_all_products_with_metrics,
    get_scenario_by_name,
    create_submission,
)

router = APIRouter(prefix="/api/v1/assortment")


@router.get("/kpis", response_model=KpiResponse)
def get_kpis(db: Session = Depends(get_db)):
    # Return high-level KPI data for the header strip
    # Let's return the default values matching the WorkSpec and Stitch HTML
    return KpiResponse(
        in_stock_rate=96.4,
        private_brand_pct=22.0,
        sales_lift_pct=4.5,
        sales_per_linear_ft=15.75,
        shelf_capacity_utilization=88.0,
    )


@router.get("/skus", response_model=List[SkuResponse])
def get_skus(cluster: str = "small-town-value", db: Session = Depends(get_db)):
    # Return a list of all SKUs with their performance data and status badge
    skus = get_all_products_with_metrics(db)
    return skus


@router.get("/scenarios/{scenario_name}", response_model=ScenarioResponse)
def get_scenario(scenario_name: str, db: Session = Depends(get_db)):
    # Return the projected impact and SKU actions for a given scenario
    scen = get_scenario_by_name(db, scenario_name)
    if not scen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_name}' not found",
        )

    rules = scen.rules
    private_brand_mix = rules.get("private_brand_mix", 0.0)
    shelf_capacity = rules.get("shelf_capacity", 0.0)

    # Guardrail checks
    private_brand_ok = private_brand_mix >= 20.0
    shelf_capacity_ok = shelf_capacity >= 85.0

    sku_actions = [
        SkuAction(sku_id=action["sku_id"], action=action["action"])
        for action in rules.get("sku_actions", [])
    ]

    return ScenarioResponse(
        scenario_name=scen.name,
        projected_sales_lift=rules.get("projected_sales_lift", 0.0),
        shelf_capacity=shelf_capacity,
        private_brand_mix=private_brand_mix,
        in_stock_rate=rules.get("in_stock_rate", 0.0),
        guardrails=Guardrails(
            private_brand_ok=private_brand_ok, shelf_capacity_ok=shelf_capacity_ok
        ),
        sku_actions=sku_actions,
    )


@router.post("/submit", response_model=SubmitResponse)
def submit_assortment(payload: SubmitRequest, db: Session = Depends(get_db)):
    # Submits the selected assortment scenario for approval and processing
    scen = get_scenario_by_name(db, payload.scenario_name)
    if not scen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{payload.scenario_name}' not found",
        )

    rules = scen.rules
    private_brand_mix = rules.get("private_brand_mix", 0.0)
    shelf_capacity = rules.get("shelf_capacity", 0.0)

    # Guardrail validation
    if private_brand_mix < 20.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Guardrail validation failed: Private Brand % must be >= 20%",
        )
    if shelf_capacity < 85.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Guardrail validation failed: Shelf capacity utilization must be >= 85%",
        )

    # Create submission record
    actions_list = [
        {"sku_id": a.sku_id, "action": a.action} for a in payload.sku_actions
    ]
    submission = create_submission(
        db=db,
        scenario_name=payload.scenario_name,
        sku_actions=actions_list,
        submitted_by="user@example.com",
    )

    # Generate a unique audit ID
    audit_id = f"{submission.id.hex[:5].upper()}-ABCDE"

    return SubmitResponse(
        audit_id=audit_id,
        submitted_at=submission.submitted_at,
        submitted_by=submission.submitted_by,
        success=True,
    )
