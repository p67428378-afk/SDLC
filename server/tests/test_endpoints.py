import pytest
from fastapi.testclient import TestClient
import uuid

def test_read_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the DG Cluster Assortment Advisor API"}

def test_read_kpis(client: TestClient):
    response = client.get("/api/v1/kpis")
    assert response.status_code == 200
    data = response.json()
    assert "in_stock_rate" in data
    assert "private_brand_pct" in data
    assert "sales_per_linear_ft" in data
    assert "shelf_capacity_pct" in data
    assert data["in_stock_rate"] == 96.2

def test_read_skus_performance(client: TestClient):
    response = client.get("/api/v1/skus/performance")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data
    assert len(data["items"]) > 0
    
    # Test search
    response_search = client.get("/api/v1/skus/performance?search=Potato")
    assert response_search.status_code == 200
    data_search = response_search.json()
    for item in data_search["items"]:
        assert "potato" in item["name"].lower() or "potato" in item["category"].lower()

    # Test status filter
    response_status = client.get("/api/v1/skus/performance?status=GROW")
    assert response_status.status_code == 200
    data_status = response_status.json()
    for item in data_status["items"]:
        assert item["status"] == "GROW"

def test_read_scenario(client: TestClient):
    # Test valid scenario
    response = client.get("/api/v1/scenarios/balanced")
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_name"] == "Balanced"
    assert "guardrails" in data
    assert "sku_actions" in data
    assert len(data["sku_actions"]["actions"]) > 0

    # Test invalid scenario
    response_invalid = client.get("/api/v1/scenarios/invalid_scenario")
    assert response_invalid.status_code == 404

def test_submit_assortment(client: TestClient):
    # First get a scenario to have valid SKU actions
    scenario_resp = client.get("/api/v1/scenarios/balanced")
    assert scenario_resp.status_code == 200
    scenario_data = scenario_resp.json()

    payload = {
        "scenario_name": "Balanced",
        "user_id": "manager_123",
        "sku_actions": scenario_data["sku_actions"],
        "guardrail_status": scenario_data["guardrails"]
    }

    response = client.post("/api/v1/assortment/submit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["scenario_name"] == "Balanced"
    assert data["user_id"] == "manager_123"
    assert "created_at" in data

    # Test invalid scenario name submission
    payload_invalid = payload.copy()
    payload_invalid["scenario_name"] = "InvalidScenario"
    response_invalid = client.post("/api/v1/assortment/submit", json=payload_invalid)
    assert response_invalid.status_code == 400
