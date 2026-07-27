from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SessionResponse(BaseModel):
    id: str
    channel: str
    device_info: str
    ip_address: str
    location: Optional[str] = None
    is_current: bool
    last_active_at: datetime

    class Config:
        from_attributes = True
