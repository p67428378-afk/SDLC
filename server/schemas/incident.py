from pydantic import BaseModel
from datetime import datetime


class IncidentResponse(BaseModel):
    id: str
    timestamp: datetime
    severity: str
    endpoint: str
    error_type: str
    message: str
    correlation_id: str

    class Config:
        from_attributes = True
