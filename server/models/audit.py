from sqlalchemy import Column, String, DateTime, JSON
from server.database import Base
from datetime import datetime, timezone


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, unique=True, nullable=False)
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    event_type = Column(String(100), nullable=False)
    actor = Column(String(255), nullable=False)
    resource = Column(String(255), nullable=False)
    ip_address = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    details = Column(JSON, default=dict, nullable=False)
