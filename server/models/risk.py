from sqlalchemy import Column, String, Integer, JSON, DateTime
from server.database import Base
from datetime import datetime, timezone


class RiskSignal(Base):
    __tablename__ = "risk_signals"

    id = Column(String(36), primary_key=True, unique=True, nullable=False)
    user_id = Column(String(36), nullable=False)
    risk_score = Column(Integer, nullable=False)
    signal_type = Column(String(100), nullable=False)
    details = Column(JSON, default=dict, nullable=False)
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
