from sqlalchemy import Column, String, Text, DateTime
from server.database import Base
from datetime import datetime, timezone


class ConfigItem(Base):
    __tablename__ = "config_items"

    id = Column(String(36), primary_key=True, unique=True, nullable=False)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
