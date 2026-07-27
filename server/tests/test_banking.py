from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from server.models.user import User
from server.models.banking import Account
from server.utils.security import create_access_token
from server.routers.auth import step_up_sessions
from datetime import datetime, timezone, timedelta
from decimal import Decimal


def test_list_accounts(client: TestClient, db_session: Session):
    user = db_session.query(User).filter(User.username == "testuser").first()
    token = create_access_token({"sub": user.id, "role": user.role})

    # Accounts are already seeded by lifespan!
    response = client.get(
        "/api/v1/accounts", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["account_number"] == "1234567890"


def test_internal_transfer_happy_path(client: TestClient, db_session: Session):
    user = db_session.query(User).filter(User.username == "testuser").first()
    token = create_access_token({"sub": user.id, "role": user.role})

    # Get seeded accounts
    checking = (
        db_session.query(Account).filter(Account.account_number == "1234567890").first()
    )
    savings = (
        db_session.query(Account).filter(Account.account_number == "0987654321").first()
    )

    response = client.post(
        "/api/v1/transfers/internal",
        json={
            "source_account_id": checking.id,
            "destination_account_id": savings.id,
            "amount": 200.00,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "completed"
    assert Decimal(str(data["amount"])) == Decimal("200.00")

    # Verify balances
    db_session.refresh(checking)
    db_session.refresh(savings)
    assert checking.balance == Decimal("12250.82")
    assert savings.balance == Decimal("45320.45")


def test_add_payee_requires_step_up(client: TestClient, db_session: Session):
    user = db_session.query(User).filter(User.username == "testuser").first()
    token = create_access_token({"sub": user.id, "role": user.role})

    # Attempt to add payee without step-up session ID
    response = client.post(
        "/api/v1/payees",
        json={
            "name": "John Doe",
            "account_number": "9876543210",
            "routing_number": "123456789",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    assert "step-up" in response.json()["detail"].lower()

    # Create verified step-up session
    step_up_session_id = "step-up-session-id"
    step_up_sessions[step_up_session_id] = {
        "user_id": user.id,
        "code": "123456",
        "verified": True,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
    }

    # Add payee with step-up session ID
    response = client.post(
        "/api/v1/payees",
        json={
            "name": "John Doe",
            "account_number": "9876543210",
            "routing_number": "123456789",
            "step_up_session_id": step_up_session_id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending_verification"
    assert data["name"] == "John Doe"
