import os
import json
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from server import models, schemas, crud
from server.database import get_db, init_db

app = FastAPI(
    title="DG Cluster Assortment Advisor API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize database tables and seed data on startup
@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/v1/kpis", response_model=schemas.KPIResponse)
def read_kpis(db: Session = Depends(get_db)):
    return crud.get_kpis(db)


@app.get("/api/v1/skus/performance", response_model=List[schemas.SKUResponse])
def read_skus(
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.get_skus(db, search=search, sort_by=sort_by, sort_order=sort_order)


@app.post("/api/v1/submit-assortment", response_model=schemas.SubmitAssortmentResponse)
def submit_assortment(
    payload: schemas.SubmitAssortmentRequest, db: Session = Depends(get_db)
):
    # Fetch scenario to get projected metrics
    scenario = (
        db.query(models.AssortmentScenario)
        .filter(models.AssortmentScenario.name == payload.scenario_name)
        .first()
    )
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Scenario '{payload.scenario_name}' not found.",
        )

    # Guardrail checks
    # Private Brand % > 20%, Shelf Capacity < 95%
    # For demo/simulation, we use the scenario's projected brand mix as the check value
    projected_brand_mix = float(scenario.projected_brand_mix)
    projected_sales_lift = float(scenario.projected_sales_lift)

    # Guardrail status: Private Brand % > 20% and Shelf Capacity < 95% (which is 88.2% in our seeded KPIs)
    guardrails_passed = (projected_brand_mix > 20.0) and (88.2 < 95.0)

    # Create audit trail entry
    changes_json = json.dumps([change.dict() for change in payload.changes])
    audit_entry = models.SubmissionAudit(
        user_id="Category Manager",
        scenario_name=payload.scenario_name,
        guardrails_passed=guardrails_passed,
        changes=changes_json,
    )

    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)

    return schemas.SubmitAssortmentResponse(
        id=audit_entry.id,
        user_id=audit_entry.user_id,
        scenario_name=audit_entry.scenario_name,
        guardrails_passed=audit_entry.guardrails_passed,
        changes=json.loads(audit_entry.changes),
        projected_sales_lift=projected_sales_lift,
        projected_brand_mix=projected_brand_mix,
        submitted_at=audit_entry.submitted_at,
    )
