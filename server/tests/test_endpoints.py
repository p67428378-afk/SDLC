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


def test_login_with_email_success(client: TestClient):
    payload = {"username": "test@example.com", "password": "testpassword"}
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


def test_admin_audit_trail_verify(client: TestClient):
    # Login as admin
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "adminuser", "password": "adminpassword"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify audit trail
    response = client.get("/api/v1/banking/admin/audit-trail/verify", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "is_intact" in data
    assert data["is_intact"] is True


def test_export_transactions_csv(client: TestClient):
    # Login as customer
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

    # Export CSV
    response = client.get(
        f"/api/v1/banking/accounts/{checking_id}/transactions/export?format=csv",
        headers=headers,
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    content = response.text
    assert "Transaction ID" in content
    assert "Source Account" in content


def test_download_genuine_pdf_statement(client: TestClient):
    # Login as customer
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "testuser", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Download statement
    response = client.get(
        "/api/v1/banking/statements/statement_2026_07.pdf",
        headers=headers,
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    # PDF header bytes
    assert response.content.startswith(b"%PDF")


def test_sse_stream_endpoint(client: TestClient):
    # Login as customer
    login_response = client.post(
        "/api/v1/banking/auth/login",
        json={"username": "testuser", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Mock broker.subscribe to yield a single message and exit
    async def mock_subscribe(channels):
        yield '{"event": "test", "data": {}}'

    from server.utils.broker import broker

    original_subscribe = broker.subscribe
    broker.subscribe = mock_subscribe

    try:
        response = client.get("/api/v1/banking/stream", headers=headers)
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        assert 'data: {"event": "test", "data": {}}' in response.text
    finally:
        broker.subscribe = original_subscribe


def test_tiered_admin_rbac_and_new_endpoints(client: TestClient, db_session):
    from server.models import User, Account, FraudAlert
    from server.database import get_password_hash
    import uuid

    # Create tiered admin users
    support_user = User(
        id=str(uuid.uuid4()),
        username="supportuser",
        email="support@example.com",
        hashed_password=get_password_hash("supportpassword"),
        full_name="Support User",
        role="support_admin",
        is_active=True,
    )
    analyst_user = User(
        id=str(uuid.uuid4()),
        username="analystuser",
        email="analyst@example.com",
        hashed_password=get_password_hash("analystpassword"),
        full_name="Analyst User",
        role="fraud_analyst",
        is_active=True,
    )
    sysadmin_user = User(
        id=str(uuid.uuid4()),
        username="sysadminuser",
        email="sysadmin@example.com",
        hashed_password=get_password_hash("sysadminpassword"),
        full_name="SysAdmin User",
        role="system_admin",
        is_active=True,
    )
    db_session.add_all([support_user, analyst_user, sysadmin_user])
    db_session.commit()

    # Login helper
    def get_token(username, password):
        resp = client.post(
            "/api/v1/banking/auth/login",
            json={"username": username, "password": password},
        )
        return resp.json()["access_token"]

    support_token = get_token("supportuser", "supportpassword")
    analyst_token = get_token("analystuser", "analystpassword")
    sysadmin_token = get_token("sysadminuser", "sysadminpassword")

    support_headers = {"Authorization": f"Bearer {support_token}"}
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}
    sysadmin_headers = {"Authorization": f"Bearer {sysadmin_token}"}

    # 1. Test GET /admin/summary
    # Support admin should be able to access
    resp = client.get("/api/v1/banking/admin/summary", headers=support_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_customers" in data
    assert "open_fraud_alerts" in data
    assert "suspended_accounts" in data
    assert "transactions_24h" in data
    assert "audit_chain_intact" in data

    # 2. Test GET /admin/audit-trail with search
    # Support admin should NOT be able to access (restricted to system_admin)
    resp = client.get("/api/v1/banking/admin/audit-trail", headers=support_headers)
    assert resp.status_code == 403

    # Sysadmin should be able to access
    resp = client.get(
        "/api/v1/banking/admin/audit-trail?search=USER_LOGIN", headers=sysadmin_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data

    # 3. Test GET /admin/audit-trail/export
    # Support admin should NOT be able to access
    resp = client.get(
        "/api/v1/banking/admin/audit-trail/export?format=csv", headers=support_headers
    )
    assert resp.status_code == 403

    # Sysadmin should be able to access
    resp = client.get(
        "/api/v1/banking/admin/audit-trail/export?format=csv", headers=sysadmin_headers
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "text/csv; charset=utf-8"
    assert "Audit ID" in resp.text

    # 4. Test PATCH /admin/fraud-alerts/{alertId}
    # Get a fraud alert ID
    alert = db_session.query(FraudAlert).first()
    assert alert is not None

    # Support admin should NOT be able to update fraud alert
    resp = client.patch(
        f"/api/v1/banking/admin/fraud-alerts/{alert.id}",
        json={"status": "resolved", "note": "Resolved by test"},
        headers=support_headers,
    )
    assert resp.status_code == 403

    # Analyst should be able to update fraud alert
    resp = client.patch(
        f"/api/v1/banking/admin/fraud-alerts/{alert.id}",
        json={"status": "resolved", "note": "Resolved by analyst"},
        headers=analyst_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "resolved"
    assert resp.json()["note"] == "Resolved by analyst"

    # 5. Test Customer Drill-Down
    # Get a customer ID
    customer = db_session.query(User).filter(User.role == "customer").first()
    assert customer is not None

    # Support admin should be able to view customer detail
    resp = client.get(
        f"/api/v1/banking/admin/customers/{customer.id}", headers=support_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["profile"]["id"] == customer.id
    assert "accounts" in data
    assert "recent_transactions" in data
    assert "audit_events" in data

    # Get an account ID
    account = db_session.query(Account).filter(Account.user_id == customer.id).first()
    assert account is not None

    # Support admin should be able to view account detail
    resp = client.get(
        f"/api/v1/banking/admin/accounts/{account.id}", headers=support_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["account"]["id"] == account.id
    assert data["owner"]["id"] == customer.id
    assert "recent_transactions" in data

    # 6. Test Account Lifecycle Management (Reactivate and Close)
    # Suspend account first (Analyst can do this)
    resp = client.post(
        f"/api/v1/banking/admin/accounts/{account.id}/suspend",
        json={"reason": "Suspicious activity"},
        headers=analyst_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "suspended"

    # Support admin should NOT be able to reactivate
    resp = client.post(
        f"/api/v1/banking/admin/accounts/{account.id}/reactivate",
        json={"reason": "Reactivating"},
        headers=support_headers,
    )
    assert resp.status_code == 403

    # Analyst should be able to reactivate
    resp = client.post(
        f"/api/v1/banking/admin/accounts/{account.id}/reactivate",
        json={"reason": "Reactivating"},
        headers=analyst_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"

    # Analyst should NOT be able to close
    resp = client.post(
        f"/api/v1/banking/admin/accounts/{account.id}/close",
        json={"reason": "Closing"},
        headers=analyst_headers,
    )
    assert resp.status_code == 403

    # Sysadmin should be able to close
    resp = client.post(
        f"/api/v1/banking/admin/accounts/{account.id}/close",
        json={"reason": "Closing"},
        headers=sysadmin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "closed"
