from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from server.models.user import User
from server.models.webhook import WebhookSubscription
from server.utils.security import create_access_token
from datetime import datetime, timezone


def test_subscribe_webhook(client: TestClient, db_session: Session):
    user = db_session.query(User).filter(User.username == "testuser").first()
    token = create_access_token({"sub": user.id, "role": user.role})

    response = client.post(
        "/api/v1/webhooks",
        json={"url": "https://example.com/webhook", "events": ["transfer_completed"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["url"] == "https://example.com/webhook"
    assert "transfer_completed" in data["events"]


def test_list_webhooks(client: TestClient, db_session: Session):
    user = db_session.query(User).filter(User.username == "testuser").first()
    token = create_access_token({"sub": user.id, "role": user.role})

    sub = WebhookSubscription(
        id="sub-id",
        user_id=user.id,
        url="https://example.com/webhook",
        events=["transfer_completed"],
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(sub)
    db_session.commit()

    response = client.get(
        "/api/v1/webhooks", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["url"] == "https://example.com/webhook"
