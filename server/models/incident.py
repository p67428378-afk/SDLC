from sqlalchemy import Column, String, Text, DateTime
from server.database import Base
from datetime import datetime, timezone


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, unique=True, nullable=False)
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    severity = Column(String(50), nullable=False)
    endpoint = Column(String(255), nullable=False)
    error_type = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    correlation_id = Column(String(100), nullable=False)
