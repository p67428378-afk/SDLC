from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from server.models.user import User
from server.models.session import Session as UserSession
from server.utils.security import create_access_token
from datetime import datetime, timezone, timedelta


def test_list_sessions(client: TestClient, db_session: Session):
    user = db_session.query(User).filter(User.username == "testuser").first()
    token = create_access_token({"sub": user.id, "role": user.role})

    # Create a session
    session = UserSession(
        id="session-id",
        user_id=user.id,
        refresh_token="refresh-token",
        channel="web",
        device_info="test-device",
        ip_address="127.0.0.1",
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        is_active=True,
    )
    db_session.add(session)
    db_session.commit()

    response = client.get(
        "/api/v1/sessions", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["device_info"] == "test-device"


def test_revoke_session(client: TestClient, db_session: Session):
    user = db_session.query(User).filter(User.username == "testuser").first()
    token = create_access_token({"sub": user.id, "role": user.role})

    session = UserSession(
        id="session-id",
        user_id=user.id,
        refresh_token="refresh-token",
        channel="web",
        device_info="test-device",
        ip_address="127.0.0.1",
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        is_active=True,
    )
    db_session.add(session)
    db_session.commit()

    response = client.post(
        "/api/v1/sessions/session-id/revoke",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Session successfully revoked"

    # Verify session is inactive
    db_session.refresh(session)
    assert not session.is_active
