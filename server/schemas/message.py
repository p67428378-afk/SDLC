from pydantic import BaseModel
from datetime import datetime


class MessageRequest(BaseModel):
    subject: str
    body: str


class MessageResponse(BaseModel):
    id: str
    subject: str
    body: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MessageUpdate(BaseModel):
    is_read: bool
