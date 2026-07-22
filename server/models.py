import uuid
from datetime import datetime
from sqlalchemy import Column, String, Date, Numeric, Integer, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from server.database import Base
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36), storing as string.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            if isinstance(value, uuid.UUID):
                return str(value)
            else:
                return str(uuid.UUID(value))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            value = uuid.UUID(value)
        return value

class Product(Base):
    __tablename__ = "products"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    sku_id = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    category = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    performance_metrics = relationship("PerformanceMetric", back_populates="product", cascade="all, delete-orphan")

class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    product_id = Column(GUID, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    sales = Column(Numeric, nullable=False)
    units_sold = Column(Integer, nullable=False)
    profit_margin = Column(Numeric, nullable=False)
    in_stock_rate = Column(Numeric, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    product = relationship("Product", back_populates="performance_metrics")

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    rules = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class AssortmentSubmission(Base):
    __tablename__ = "assortment_submissions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    scenario_name = Column(String, nullable=False)
    sku_actions = Column(JSON, nullable=False)
    submitted_by = Column(String, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
