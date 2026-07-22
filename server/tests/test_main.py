def test_get_kpis(client):
    response = client.get("/api/v1/assortment/kpis")
    assert response.status_code == 200
    data = response.json()
    assert "sales_per_linear_ft" in data
    assert "private_brand_pct" in data
    assert "in_stock_rate" in data
    assert "shelf_capacity" in data
    # Check that values are reasonable
    assert data["sales_per_linear_ft"] > 0
    assert data["private_brand_pct"] > 0
    assert data["in_stock_rate"] > 0
    assert data["shelf_capacity"] > 0


def test_get_skus(client):
    response = client.get("/api/v1/assortment/skus")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 6
    sku_codes = [s["sku_code"] for s in data]
    assert "SKU-1001" in sku_codes
    assert "SKU-1002" in sku_codes


def test_get_scenario_success(client):
    response = client.get("/api/v1/assortment/scenario/Balanced")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Balanced"
    assert data["projected_sales_impact"] == 3.5
    assert data["projected_brand_mix"] == 25.2
    assert len(data["sku_actions"]) > 0
    assert len(data["guardrails"]) > 0


def test_get_scenario_not_found(client):
    response = client.get("/api/v1/assortment/scenario/InvalidScenario")
    assert response.status_code == 404
    assert "invalid or not found" in response.json()["detail"]


def test_submit_assortment_success(client):
    payload = {
        "scenario_name": "Balanced",
        "sku_actions": [
            {"sku_code": "SKU-1001", "action": "GROW"},
            {"sku_code": "SKU-1005", "action": "SWAP"},
        ],
    }
    response = client.post("/api/v1/assortment/submit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_name"] == "Balanced"
    assert len(data["sku_actions"]) == 2
    assert "transaction_id" in data
    assert "submitted_at" in data
    assert data["message"] == "Assortment plan submitted successfully."


def test_submit_assortment_invalid_scenario(client):
    payload = {"scenario_name": "InvalidScenario", "sku_actions": []}
    response = client.post("/api/v1/assortment/submit", json=payload)
    assert response.status_code == 400
    assert "does not exist" in response.json()["detail"]
