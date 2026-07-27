import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Numeric,
    Integer,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from server.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True
    )
    username = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="customer")
    is_active = Column(Boolean, nullable=False, default=True)

    # Preferences
    email_alerts = Column(Boolean, nullable=False, default=True)
    sms_alerts = Column(Boolean, nullable=False, default=False)
    min_alert_amount = Column(Numeric(15, 2), nullable=False, default=0.00)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    accounts = relationship(
        "Account", back_populates="user", cascade="all, delete-orphan"
    )


class Account(Base):
    __tablename__ = "accounts"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True
    )
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    account_number = Column(String(50), unique=True, nullable=False)
    account_type = Column(String(50), nullable=False)
    balance = Column(Numeric(15, 2), nullable=False, default=0.00)
    currency = Column(String(10), nullable=False, default="USD")
    status = Column(String(50), nullable=False, default="active")

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user = relationship("User", back_populates="accounts")
    statements = relationship(
        "Statement", back_populates="account", cascade="all, delete-orphan"
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True
    )
    source_account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False)
    destination_account_id = Column(
        String(36), ForeignKey("accounts.id"), nullable=True
    )
    amount = Column(Numeric(15, 2), nullable=False)
    type = Column(String(50), nullable=False)  # debit, credit, transfer
    description = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="pending")

    transaction_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    source_account = relationship("Account", foreign_keys=[source_account_id])
    destination_account = relationship("Account", foreign_keys=[destination_account_id])
    fraud_alert = relationship(
        "FraudAlert",
        back_populates="transaction",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Statement(Base):
    __tablename__ = "statements"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True
    )
    account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    download_url = Column(String(255), nullable=False)
    statement_date = Column(String(50), nullable=False)  # YYYY-MM

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    account = relationship("Account", back_populates="statements")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True
    )
    user_id = Column(String(255), nullable=False)
    event_type = Column(String(100), nullable=False)
    event_details = Column(JSON, nullable=False)
    source_ip = Column(String(50), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    previous_hash = Column(String(64), nullable=True)
    current_hash = Column(String(64), nullable=False, unique=True)


class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True
    )
    transaction_id = Column(String(36), ForeignKey("transactions.id"), nullable=False)
    rule_triggered = Column(String(255), nullable=False)
    risk_score = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default="open")
    note = Column(String(1024), nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    transaction = relationship("Transaction", back_populates="fraud_alert")
