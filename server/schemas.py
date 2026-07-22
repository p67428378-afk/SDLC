from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class KpiResponse(BaseModel):
    in_stock_rate: float
    private_brand_pct: float
    sales_lift_pct: float
    sales_per_linear_ft: float
    shelf_capacity_utilization: float

class SkuResponse(BaseModel):
    sku_id: str
    name: str
    brand: str
    sales: float
    units_sold: int
    profit_margin: float
    in_stock_rate: float
    status: str

class Guardrails(BaseModel):
    private_brand_ok: bool
    shelf_capacity_ok: bool

class SkuAction(BaseModel):
    sku_id: str
    action: str

class ScenarioResponse(BaseModel):
    scenario_name: str
    projected_sales_lift: float
    shelf_capacity: float
    private_brand_mix: float
    in_stock_rate: float
    guardrails: Guardrails
    sku_actions: List[SkuAction]

class SubmitRequest(BaseModel):
    scenario_name: str
    sku_actions: List[SkuAction]

class SubmitResponse(BaseModel):
    audit_id: str
    submitted_at: datetime
    submitted_by: str
    success: bool
