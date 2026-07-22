from pydantic import BaseModel
from typing import List
from datetime import datetime


class KPIResponse(BaseModel):
    sales_per_linear_ft: float
    private_brand_pct: float
    in_stock_rate: float
    shelf_capacity: float

    class Config:
        from_attributes = True
        orm_mode = True


class SKUResponse(BaseModel):
    id: str
    sku_code: str
    name: str
    brand: str
    weekly_sales: float
    units_sold: int
    profit_margin: float
    shelf_space: float
    in_stock_rate: float
    status: str

    class Config:
        from_attributes = True
        orm_mode = True


class SkuActionSchema(BaseModel):
    sku_code: str
    action: str

    class Config:
        from_attributes = True
        orm_mode = True


class GuardrailSchema(BaseModel):
    name: str
    status: str
    message: str

    class Config:
        from_attributes = True
        orm_mode = True


class ScenarioResponse(BaseModel):
    name: str
    projected_sales_impact: float
    projected_brand_mix: float
    sku_actions: List[SkuActionSchema]
    guardrails: List[GuardrailSchema]

    class Config:
        from_attributes = True
        orm_mode = True


class SubmitRequest(BaseModel):
    scenario_name: str
    sku_actions: List[SkuActionSchema]


class SubmitResponse(BaseModel):
    id: str
    message: str
    scenario_name: str
    sku_actions: List[SkuActionSchema]
    submitted_at: datetime
    transaction_id: str
    user_id: str

    class Config:
        from_attributes = True
        orm_mode = True
