from pydantic import BaseModel
from typing import Dict
from datetime import datetime
from decimal import Decimal


class AlertResponse(BaseModel):
    id: str
    type: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AlertPreferenceResponse(BaseModel):
    id: str
    low_balance_threshold: Decimal
    large_transaction_threshold: Decimal
    channels: Dict[str, bool]

    class Config:
        from_attributes = True


class AlertPreferenceRequest(BaseModel):
    low_balance_threshold: Decimal
    large_transaction_threshold: Decimal
    channels: Dict[str, bool]
