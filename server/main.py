from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware
import os
from typing import List

from server.database import init_db, get_db
from server.schemas import (
    KPIResponse,
    SKUResponse,
    ScenarioResponse,
    SubmitRequest,
    SubmitResponse,
)
from server import crud


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database and seed data
    init_db()
    yield


app = FastAPI(
    title="DG Cluster Assortment Advisor API",
    description="API for DG Cluster Assortment Advisor",
    version="1.0.0",
    lifespan=lifespan,
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


@app.get("/api/v1/assortment/kpis", response_model=KPIResponse)
def get_kpis(db: Session = Depends(get_db)):
    try:
        return crud.get_kpis(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error occurs while calculating or fetching KPIs: {str(e)}",
        )


@app.get("/api/v1/assortment/skus", response_model=List[SKUResponse])
def get_skus(db: Session = Depends(get_db)):
    try:
        return crud.get_skus(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error occurs while fetching SKU performance data: {str(e)}",
        )


@app.get("/api/v1/assortment/scenario/{name}", response_model=ScenarioResponse)
def get_scenario(name: str, db: Session = Depends(get_db)):
    try:
        scenario = crud.get_scenario_by_name(db, name)
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"The requested scenario name '{name}' is invalid or not found.",
            )
        return scenario
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error occurs while modeling the scenario: {str(e)}",
        )


@app.post("/api/v1/assortment/submit", response_model=SubmitResponse)
def submit_assortment(request: SubmitRequest, db: Session = Depends(get_db)):
    try:
        # Validate scenario name
        scenario = crud.get_scenario_by_name(db, request.scenario_name)
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Submission fails validation: Scenario '{request.scenario_name}' does not exist.",
            )

        # Create submission
        return crud.create_submission(
            db=db, scenario_name=request.scenario_name, sku_actions=request.sku_actions
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error occurs during submission processing: {str(e)}",
        )
