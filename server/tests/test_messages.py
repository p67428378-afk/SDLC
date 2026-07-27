from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from server.models.user import User
from server.models.message import Message
from server.utils.security import create_access_token
from datetime import datetime, timezone


def test_list_messages(client: TestClient, db_session: Session):
    user = db_session.query(User).filter(User.username == "testuser").first()
    token = create_access_token({"sub": user.id, "role": user.role})

    message = Message(
        id="message-id",
        user_id=user.id,
        subject="Welcome",
        body="Welcome to ApexSecure!",
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(message)
    db_session.commit()

    response = client.get(
        "/api/v1/messages", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["subject"] == "Welcome"


def test_send_message(client: TestClient, db_session: Session):
    user = db_session.query(User).filter(User.username == "testuser").first()
    token = create_access_token({"sub": user.id, "role": user.role})

    response = client.post(
        "/api/v1/messages",
        json={"subject": "Support Inquiry", "body": "I need help with my account."},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["subject"] == "Support Inquiry"
    assert data["body"] == "I need help with my account."
