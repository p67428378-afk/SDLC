from pydantic import BaseModel
from typing import List
from datetime import datetime


class WebhookRequest(BaseModel):
    url: str
    events: List[str]


class WebhookResponse(BaseModel):
    id: str
    url: str
    events: List[str]
    created_at: datetime

    class Config:
        from_attributes = True
