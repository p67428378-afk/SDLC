import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.main import app
from server.database import Base, get_db
from server import models

# Setup SQLite in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Override the get_db dependency
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    # Create tables and seed data before each test
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    models.seed_data(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_read_kpis(client):
    response = client.get("/api/v1/kpis")
    assert response.status_code == 200
    data = response.json()
    assert data["sales_per_linear_ft"] == 342.50
    assert data["private_brand_percentage"] == 24.5
    assert data["in_stock_rate"] == 96.8
    assert data["shelf_capacity_percentage"] == 88.2


def test_read_skus(client):
    response = client.get("/api/v1/skus/performance")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    assert (
        data[0]["sku_name"] == "Brand X Cheese Puffs 6oz"
    )  # Sorted alphabetically by default


def test_read_skus_search(client):
    response = client.get("/api/v1/skus/performance?search=Potato")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert "Potato" in data[0]["sku_name"]


def test_submit_assortment(client):
    payload = {
        "scenario_name": "Balanced",
        "changes": [
            {
                "action": "ADD",
                "sku_name": "Clover Valley Spicy Nacho Chips 10oz",
                "details": "+Proj. Sales $450/wk",
            },
            {
                "action": "REMOVE",
                "sku_name": "Brand Z Cheese Puffs 6oz",
                "details": "Frees 1.2 linear ft",
            },
        ],
    }
    response = client.post("/api/v1/submit-assortment", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_name"] == "Balanced"
    assert data["guardrails_passed"] is True
    assert len(data["changes"]) == 2
    assert data["projected_sales_lift"] == 3.8
    assert data["projected_brand_mix"] == 24.5


def test_submit_invalid_scenario(client):
    payload = {"scenario_name": "InvalidScenario", "changes": []}
    response = client.post("/api/v1/submit-assortment", json=payload)
    assert response.status_code == 400
    assert "not found" in response.json()["detail"]
