from sqlalchemy import Column, String, Boolean, DateTime
from server.database import Base
from datetime import datetime, timezone


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, unique=True, nullable=False)
    user_id = Column(String(36), nullable=False)
    refresh_token = Column(String(512), unique=True, nullable=False)
    channel = Column(String(50), nullable=False)
    device_info = Column(String(255), nullable=False)
    ip_address = Column(String(50), nullable=False)
    location = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_active_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
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
