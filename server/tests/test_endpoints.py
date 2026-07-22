import pytest
from fastapi.testclient import TestClient

def test_read_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the DG Cluster Assortment Advisor API"}

def test_get_kpis(client: TestClient):
    response = client.get("/api/v1/assortment/kpis")
    assert response.status_code == 200
    data = response.json()
    assert "in_stock_rate" in data
    assert "private_brand_pct" in data
    assert "sales_lift_pct" in data
    assert "sales_per_linear_ft" in data
    assert "shelf_capacity_utilization" in data
    assert data["private_brand_pct"] == 22.0

def test_get_skus(client: TestClient):
    response = client.get("/api/v1/assortment/skus")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Check first item structure
    first_sku = data[0]
    assert "sku_id" in first_sku
    assert "name" in first_sku
    assert "brand" in first_sku
    assert "sales" in first_sku
    assert "units_sold" in first_sku
    assert "profit_margin" in first_sku
    assert "in_stock_rate" in first_sku
    assert "status" in first_sku

def test_get_scenario_success(client: TestClient):
    response = client.get("/api/v1/assortment/scenarios/balanced")
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_name"] == "balanced"
    assert data["projected_sales_lift"] == 4.5
    assert data["shelf_capacity"] == 89.0
    assert data["private_brand_mix"] == 23.5
    assert data["guardrails"]["private_brand_ok"] is True
    assert data["guardrails"]["shelf_capacity_ok"] is True
    assert len(data["sku_actions"]) > 0

def test_get_scenario_not_found(client: TestClient):
    response = client.get("/api/v1/assortment/scenarios/nonexistent")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_submit_success(client: TestClient):
    payload = {
        "scenario_name": "balanced",
        "sku_actions": [
            {"sku_id": "SKU-101", "action": "GROW"},
            {"sku_id": "SKU-205", "action": "MAINTAIN"}
        ]
    }
    response = client.post("/api/v1/assortment/submit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "audit_id" in data
    assert "submitted_at" in data
    assert data["submitted_by"] == "user@example.com"

def test_submit_guardrail_failure(client: TestClient):
    # Aggressive scenario has private_brand_mix = 19.5% which is < 20%
    payload = {
        "scenario_name": "aggressive",
        "sku_actions": [
            {"sku_id": "SKU-101", "action": "GROW"},
            {"sku_id": "SKU-205", "action": "REDUCE"}
        ]
    }
    response = client.post("/api/v1/assortment/submit", json=payload)
    assert response.status_code == 400
    assert "Guardrail validation failed" in response.json()["detail"]

def test_submit_not_found(client: TestClient):
    payload = {
        "scenario_name": "nonexistent",
        "sku_actions": []
    }
    response = client.post("/api/v1/assortment/submit", json=payload)
    assert response.status_code == 404
