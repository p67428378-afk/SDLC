from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from server.database import get_db
from server.schemas import KPISchema, SKUPerformanceResponse, ScenarioResponse, AssortmentSubmitRequest, AssortmentSubmitResponse
from server import crud

router = APIRouter()

@router.get("/kpis", response_model=KPISchema)
def read_kpis(db: Session = Depends(get_db)):
    try:
        return crud.get_kpis(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection fails or calculation error occurs: {str(e)}")

@router.get("/skus/performance", response_model=SKUPerformanceResponse)
def read_skus_performance(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        return crud.get_skus_performance(db, page=page, limit=limit, search=search, status=status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query fails: {str(e)}")

@router.get("/scenarios/{scenario_name}", response_model=ScenarioResponse)
def read_scenario(scenario_name: str, db: Session = Depends(get_db)):
    try:
        scenario = crud.get_scenario(db, scenario_name)
        if not scenario:
            raise HTTPException(status_code=404, detail=f"Scenario '{scenario_name}' not found")
        return scenario
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query fails: {str(e)}")

@router.post("/assortment/submit", response_model=AssortmentSubmitResponse)
def submit_assortment(request: AssortmentSubmitRequest, db: Session = Depends(get_db)):
    try:
        # Simple validation: check if scenario_name is valid
        if request.scenario_name.lower() not in ["conservative", "balanced", "aggressive"]:
            raise HTTPException(status_code=400, detail="Invalid scenario name")
        
        decision = crud.create_assortment_decision(db, request)
        return decision
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insertion fails: {str(e)}")
