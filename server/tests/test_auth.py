from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from server.models.user import User
from server.utils.security import get_password_hash


def test_login_happy_path(client: TestClient, db_session: Session):
    # AC: Upon entering a correct password, the user must be prompted to provide a second factor for verification.
    response = client.post(
        "/api/v1/auth/login", json={"username": "testuser", "password": "testpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "mfa_session_id" in data
    assert "mfa_methods" in data
    assert "sms" in data["mfa_methods"]


def test_login_invalid_credentials(client: TestClient, db_session: Session):
    response = client.post(
        "/api/v1/auth/login", json={"username": "testuser", "password": "wrongpassword"}
    )
    assert response.status_code == 412
    assert response.json()["detail"] == "Invalid credentials"


def test_login_lockout_after_5_attempts(client: TestClient, db_session: Session):
    # AC: The system must defend against guessing credentials (lockout after 5 attempts).
    # We use a unique user to avoid interfering with other tests
    user = User(
        id="unique-lockout-user-id",
        username="lockoutuser",
        email="lockout@example.com",
        hashed_password=get_password_hash("testpassword"),
        role="customer",
        is_locked=False,
    )
    db_session.add(user)
    db_session.commit()

    for _ in range(5):
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "lockoutuser", "password": "wrongpassword"},
        )
        assert response.status_code == 412

    # 6th attempt should be locked
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "lockoutuser", "password": "testpassword"},
    )
    assert response.status_code == 403
    assert "locked" in response.json()["detail"].lower()


def test_mfa_verify_happy_path(client: TestClient, db_session: Session):
    # Initiate login
    login_resp = client.post(
        "/api/v1/auth/login", json={"username": "testuser", "password": "testpassword"}
    )
    mfa_session_id = login_resp.json()["mfa_session_id"]

    # Verify MFA
    verify_resp = client.post(
        "/api/v1/auth/mfa/verify",
        json={"mfa_session_id": mfa_session_id, "method": "sms", "code": "123456"},
    )
    assert verify_resp.status_code == 200
    data = verify_resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["username"] == "testuser"
