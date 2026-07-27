from sqlalchemy import Column, String, JSON, DateTime
from server.database import Base
from datetime import datetime, timezone


class WebhookSubscription(Base):
    __tablename__ = "webhook_subscriptions"

    id = Column(String(36), primary_key=True, unique=True, nullable=False)
    user_id = Column(String(36), nullable=False)
    url = Column(String(512), nullable=False)
    events = Column(JSON, default=list, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
