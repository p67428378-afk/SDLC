from pydantic import BaseModel
from typing import List, Any
from datetime import datetime


class KPIResponse(BaseModel):
    sales_per_linear_ft: float
    private_brand_percentage: float
    in_stock_rate: float
    shelf_capacity_percentage: float
    sales_growth_percentage: float
    remaining_linear_ft: float


class SKUResponse(BaseModel):
    id: str
    sku_name: str
    category: str
    weekly_sales: float
    yoy_growth: float
    profit_margin: float
    inventory_level: int
    is_private_brand: bool
    status: str

    class Config:
        from_attributes = True


class ChangeItem(BaseModel):
    action: str
    sku_name: str
    details: str


class SubmitAssortmentRequest(BaseModel):
    scenario_name: str
    changes: List[ChangeItem]


class SubmitAssortmentResponse(BaseModel):
    id: str
    user_id: str
    scenario_name: str
    guardrails_passed: bool
    changes: List[Any]
    projected_sales_lift: float
    projected_brand_mix: float
    submitted_at: datetime
