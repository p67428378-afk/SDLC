from sqlalchemy import Column, String, Integer, DateTime
from server.database import Base
from datetime import datetime, timezone


class LockoutState(Base):
    __tablename__ = "lockout_state"

    id = Column(String(36), primary_key=True, unique=True, nullable=False)
    user_id = Column(String(36), unique=True, nullable=False)
    failed_attempts = Column(Integer, default=0, nullable=False)
    last_failed_at = Column(DateTime(timezone=True), nullable=True)
    login_flow_restarts = Column(Integer, default=0, nullable=False)
    last_restart_at = Column(DateTime(timezone=True), nullable=True)
    otp_resends = Column(Integer, default=0, nullable=False)
    last_otp_resend_at = Column(DateTime(timezone=True), nullable=True)
    otp_code = Column(String(10), nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    otp_failures = Column(Integer, default=0, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
