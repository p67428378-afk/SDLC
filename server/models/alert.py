from sqlalchemy import Column, String, Text, Boolean, DateTime, Numeric, JSON
from server.database import Base
from datetime import datetime, timezone


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, unique=True, nullable=False)
    user_id = Column(String(36), nullable=False)
    type = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class AlertPreference(Base):
    __tablename__ = "alert_preferences"

    id = Column(String(36), primary_key=True, unique=True, nullable=False)
    user_id = Column(String(36), unique=True, nullable=False)
    low_balance_threshold = Column(Numeric(15, 2), default=100.00, nullable=False)
    large_transaction_threshold = Column(
        Numeric(15, 2), default=5000.00, nullable=False
    )
    channels = Column(JSON, default=dict, nullable=False)
