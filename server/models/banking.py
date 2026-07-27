from sqlalchemy import Column, String, Numeric, DateTime
from server.database import Base
from datetime import datetime, timezone


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String(36), primary_key=True, unique=True, nullable=False)
    user_id = Column(String(36), nullable=False)
    account_number = Column(String(50), unique=True, nullable=False)
    account_type = Column(String(50), nullable=False)
    balance = Column(Numeric(15, 2), default=0.00, nullable=False)
    available_balance = Column(Numeric(15, 2), default=0.00, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    status = Column(String(50), default="active", nullable=False)
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


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, unique=True, nullable=False)
    account_id = Column(String(36), nullable=False)
    type = Column(String(50), nullable=False)
    amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    description = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    payee_id = Column(String(36), nullable=True)
    status = Column(String(50), default="completed", nullable=False)
    reference_id = Column(String(100), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Payee(Base):
    __tablename__ = "payees"

    id = Column(String(36), primary_key=True, unique=True, nullable=False)
    user_id = Column(String(36), nullable=False)
    name = Column(String(255), nullable=False)
    account_number = Column(String(50), nullable=False)
    routing_number = Column(String(50), nullable=True)
    status = Column(String(50), default="pending_verification", nullable=False)
    verification_code = Column(String(10), nullable=True)
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
