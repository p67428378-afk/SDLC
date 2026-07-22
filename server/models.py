import uuid
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class SKU(Base):
    __tablename__ = "skus"

    id = Column(
        String(36), primary_key=True, default=generate_uuid, unique=True, nullable=False
    )
    sku_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    brand = Column(String(100), nullable=False)
    weekly_sales = Column(Numeric(10, 2), default=0.00, nullable=False)
    units_sold = Column(Integer, default=0, nullable=False)
    profit_margin = Column(Numeric(5, 2), default=0.00, nullable=False)
    shelf_space = Column(Numeric(5, 2), default=0.00, nullable=False)
    in_stock_rate = Column(Numeric(5, 2), default=0.00, nullable=False)
    status = Column(String(20), default="MAINTAIN", nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    scenario_actions = relationship(
        "ScenarioSkuAction", back_populates="sku", cascade="all, delete-orphan"
    )


class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(
        String(36), primary_key=True, default=generate_uuid, unique=True, nullable=False
    )
    name = Column(String(50), unique=True, nullable=False)
    projected_sales_impact = Column(Numeric(5, 2), default=0.00, nullable=False)
    projected_brand_mix = Column(Numeric(5, 2), default=0.00, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    sku_actions = relationship(
        "ScenarioSkuAction", back_populates="scenario", cascade="all, delete-orphan"
    )


class ScenarioSkuAction(Base):
    __tablename__ = "scenario_sku_actions"

    id = Column(
        String(36), primary_key=True, default=generate_uuid, unique=True, nullable=False
    )
    scenario_id = Column(String(36), ForeignKey("scenarios.id"), nullable=False)
    sku_id = Column(String(36), ForeignKey("skus.id"), nullable=False)
    action = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    scenario = relationship("Scenario", back_populates="sku_actions")
    sku = relationship("SKU", back_populates="scenario_actions")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(
        String(36), primary_key=True, default=generate_uuid, unique=True, nullable=False
    )
    user_id = Column(String(100), nullable=False)
    scenario_name = Column(String(50), nullable=False)
    transaction_id = Column(String(100), unique=True, nullable=False)
    submitted_at = Column(DateTime, default=func.now(), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    sku_actions = relationship(
        "SubmissionSkuAction", back_populates="submission", cascade="all, delete-orphan"
    )


class SubmissionSkuAction(Base):
    __tablename__ = "submission_sku_actions"

    id = Column(
        String(36), primary_key=True, default=generate_uuid, unique=True, nullable=False
    )
    submission_id = Column(String(36), ForeignKey("submissions.id"), nullable=False)
    sku_code = Column(String(50), nullable=False)
    action = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    submission = relationship("Submission", back_populates="sku_actions")
