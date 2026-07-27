from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime


class RiskSignalResponse(BaseModel):
    id: str
    risk_score: int
    signal_type: str
    details: Dict[str, Any]
    timestamp: datetime

    class Config:
        from_attributes = True
