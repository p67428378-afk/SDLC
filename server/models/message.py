from sqlalchemy import Column, String, Text, Boolean, DateTime
from server.database import Base
from datetime import datetime, timezone


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, unique=True, nullable=False)
    user_id = Column(String(36), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
