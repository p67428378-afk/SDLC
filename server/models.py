import uuid
from sqlalchemy import Column, String, Boolean, Numeric, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import TypeDecorator, CHAR, JSON
from server.database import Base

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36), storing as string.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import UUID as PG_UUID
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(value))
            else:
                return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            return value

class SafeJSON(TypeDecorator):
    """Platform-independent JSON type.
    Uses PostgreSQL's JSONB type, otherwise uses standard JSON.
    """
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(JSONB())
        else:
            return dialect.type_descriptor(JSON())

class SKU(Base):
    __tablename__ = "skus"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    private_brand = Column(Boolean, nullable=False, default=False)
    sales = Column(Numeric, nullable=True)
    sales_growth_pct = Column(Numeric, nullable=True)
    units_sold = Column(Integer, nullable=True)
    gross_margin_pct = Column(Numeric, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

class AssortmentDecision(Base):
    __tablename__ = "assortment_decisions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    scenario_name = Column(String(50), nullable=False)
    user_id = Column(String(255), nullable=False)
    sku_actions = Column(SafeJSON, nullable=True)
    guardrail_status = Column(SafeJSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
