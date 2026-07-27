from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: str
    timestamp: datetime
    event_type: str
    actor: str
    resource: str
    ip_address: str
    status: str
    details: Dict[str, Any]

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
