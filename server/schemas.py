from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class KPISchema(BaseModel):
    in_stock_rate: float
    private_brand_pct: float
    sales_per_linear_ft: float
    shelf_capacity_pct: float

    class Config:
        from_attributes = True

class SKUPerformanceItem(BaseModel):
    id: UUID
    name: str
    category: str
    private_brand: bool
    sales: float
    sales_growth_pct: float
    status: str

    class Config:
        from_attributes = True

class SKUPerformanceResponse(BaseModel):
    items: List[SKUPerformanceItem]
    limit: int
    page: int
    total: int

class GuardrailsSchema(BaseModel):
    private_brand_goal: str
    shelf_capacity: str

class SKUActionItem(BaseModel):
    action: str
    sku_id: UUID
    sku_name: str

class SKUActionsSchema(BaseModel):
    actions: List[SKUActionItem]
    add_count: int
    remove_count: int

class ScenarioResponse(BaseModel):
    guardrails: GuardrailsSchema
    projected_private_brand_pct: float
    projected_sales_lift_pct: float
    scenario_name: str
    sku_actions: SKUActionsSchema

class AssortmentSubmitRequest(BaseModel):
    guardrail_status: GuardrailsSchema
    scenario_name: str
    sku_actions: SKUActionsSchema
    user_id: str

class AssortmentSubmitResponse(BaseModel):
    id: UUID
    scenario_name: str
    user_id: str
    sku_actions: SKUActionsSchema
    guardrail_status: GuardrailsSchema
    created_at: datetime

    class Config:
        from_attributes = True
