from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_register_user(client: TestClient):
    payload = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "newpassword",
        "full_name": "New User",
    }
    response = client.post("/api/v1/banking/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert "id" in data


def test_register_duplicate_user(client: TestClient):
    payload = {
        "username": "testuser",  # Already seeded in database.py
        "email": "test@example.com",
        "password": "testpassword",
        "full_name": "John Doe",
    }
    response = client.post("/api/v1/banking/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Username or email already exists"


def test_login_success(client: TestClient):
    payload = {"username": "testuser", "password": "testpassword"}
    response = client.post("/api/v1/banking/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "testuser"


def test_login_invalid_credentials(client: TestClient):
    payload = {"username": "testuser", "password": "wrongpassword"}
    response = client.post("/api/v1/banking/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_get_me(client: TestClient):
    # Login first
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "testuser", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/banking/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


def test_get_accounts(client: TestClient):
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "testuser", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/banking/accounts", headers=headers)
    assert response.status_code == 200
    accounts = response.json()
    assert len(accounts) >= 2
    assert any(acc["account_type"] == "checking" for acc in accounts)
    assert any(acc["account_type"] == "savings" for acc in accounts)


def test_get_account_details(client: TestClient):
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "testuser", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get accounts first to find an ID
    accounts_response = client.get("/api/v1/banking/accounts", headers=headers)
    account_id = accounts_response.json()[0]["id"]

    response = client.get(f"/api/v1/banking/accounts/{account_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == account_id


def test_get_statements(client: TestClient):
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "testuser", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get accounts first to find checking account ID
    accounts_response = client.get("/api/v1/banking/accounts", headers=headers)
    checking_id = [
        acc["id"]
        for acc in accounts_response.json()
        if acc["account_type"] == "checking"
    ][0]

    response = client.get(
        f"/api/v1/banking/accounts/{checking_id}/statements", headers=headers
    )
    assert response.status_code == 200
    statements = response.json()
    assert len(statements) >= 2
    assert statements[0]["statement_date"] in ["2026-06", "2026-07"]


def test_update_profile(client: TestClient):
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "testuser", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {"email": "updated_test@example.com", "full_name": "John Updated"}
    response = client.put("/api/v1/banking/profile", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "updated_test@example.com"
    assert data["full_name"] == "John Updated"


def test_update_preferences(client: TestClient):
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "testuser", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {"email_alerts": False, "sms_alerts": True, "min_alert_amount": 100.00}
    response = client.put("/api/v1/banking/preferences", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email_alerts"] is False
    assert data["sms_alerts"] is True
    assert data["min_alert_amount"] == 100.00


def test_get_transaction_history(client: TestClient):
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "testuser", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get checking account ID
    accounts_response = client.get("/api/v1/banking/accounts", headers=headers)
    checking_id = [
        acc["id"]
        for acc in accounts_response.json()
        if acc["account_type"] == "checking"
    ][0]

    response = client.get(
        f"/api/v1/banking/accounts/{checking_id}/transactions", headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) >= 1


def test_transfer_funds_success(client: TestClient):
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "testuser", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get accounts
    accounts_response = client.get("/api/v1/banking/accounts", headers=headers)
    accounts = accounts_response.json()
    checking = [acc for acc in accounts if acc["account_type"] == "checking"][0]
    savings = [acc for acc in accounts if acc["account_type"] == "savings"][0]

    payload = {
        "amount": 100.00,
        "description": "Test Transfer",
        "destination_account_number": savings["account_number"],
        "source_account_id": checking["id"],
    }
    response = client.post("/api/v1/banking/transfers", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 100.00
    assert data["source_account_id"] == checking["id"]
    assert data["destination_account_id"] == savings["id"]


def test_transfer_funds_insufficient_funds(client: TestClient):
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "testuser", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get accounts
    accounts_response = client.get("/api/v1/banking/accounts", headers=headers)
    accounts = accounts_response.json()
    checking = [acc for acc in accounts if acc["account_type"] == "checking"][0]
    savings = [acc for acc in accounts if acc["account_type"] == "savings"][0]

    payload = {
        "amount": 1000000.00,  # Way more than balance
        "description": "Huge Transfer",
        "destination_account_number": savings["account_number"],
        "source_account_id": checking["id"],
    }
    response = client.post("/api/v1/banking/transfers", json=payload, headers=headers)
    assert response.status_code == 400
    assert "Insufficient funds" in response.json()["detail"]


def test_admin_audit_trail_and_fraud_alerts(client: TestClient):
    # Login as admin
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "adminuser", "password": "adminpassword"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get audit trail
    response = client.get("/api/v1/banking/admin/audit-trail", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data

    # Get fraud alerts
    response = client.get("/api/v1/banking/admin/fraud-alerts", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_admin_suspend_account(client: TestClient):
    # Login as admin
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "adminuser", "password": "adminpassword"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Login as customer to get account ID
    cust_login = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "testuser", "password": "testpassword"},
    )
    cust_token = cust_login.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    accounts_response = client.get("/api/v1/banking/accounts", headers=cust_headers)
    checking_id = accounts_response.json()[0]["id"]

    # Suspend account
    payload = {"reason": "Suspicious activity detected"}
    response = client.post(
        f"/api/v1/banking/admin/accounts/{checking_id}/suspend",
        json=payload,
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "suspended"

    # Try to transfer from suspended account
    transfer_payload = {
        "amount": 10.00,
        "description": "Transfer from suspended",
        "destination_account_number": accounts_response.json()[1]["account_number"],
        "source_account_id": checking_id,
    }
    transfer_response = client.post(
        "/api/v1/banking/transfers", json=transfer_payload, headers=cust_headers
    )
    assert transfer_response.status_code == 400
    assert "suspended" in transfer_response.json()["detail"]
