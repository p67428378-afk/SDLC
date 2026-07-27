from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from server.models.user import User
from server.models.alert import Alert
from server.utils.security import create_access_token
from datetime import datetime, timezone


def test_list_alerts(client: TestClient, db_session: Session):
    user = db_session.query(User).filter(User.username == "testuser").first()
    token = create_access_token({"sub": user.id, "role": user.role})

    alert = Alert(
        id="alert-id",
        user_id=user.id,
        type="low_balance",
        message="Your balance is below $100.",
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(alert)
    db_session.commit()

    response = client.get(
        "/api/v1/alerts", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "low_balance"


def test_get_alert_preferences(client: TestClient, db_session: Session):
    user = db_session.query(User).filter(User.username == "testuser").first()
    token = create_access_token({"sub": user.id, "role": user.role})

    response = client.get(
        "/api/v1/alerts/preferences", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "low_balance_threshold" in data
    assert "large_transaction_threshold" in data
