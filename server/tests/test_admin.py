from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from server.models.user import User
from server.models.audit import AuditLog
from server.models.incident import Incident
from server.utils.security import create_access_token
from datetime import datetime, timezone


def test_list_audit_logs_admin_only(client: TestClient, db_session: Session):
    admin = db_session.query(User).filter(User.username == "adminuser").first()
    customer = db_session.query(User).filter(User.username == "testuser").first()

    admin_token = create_access_token({"sub": admin.id, "role": admin.role})
    customer_token = create_access_token({"sub": customer.id, "role": customer.role})

    # Create audit log
    log = AuditLog(
        id="log-id",
        timestamp=datetime.now(timezone.utc),
        event_type="LOGIN_SUCCESS",
        actor="testuser",
        resource="auth/login",
        ip_address="127.0.0.1",
        status="SUCCESS",
        details={},
    )
    db_session.add(log)
    db_session.commit()

    # Customer should be forbidden
    response = client.get(
        "/api/v1/admin/audit-logs",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 403

    # Admin should be allowed
    response = client.get(
        "/api/v1/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["actor"] == "testuser"


def test_get_regulatory_report_csv(client: TestClient, db_session: Session):
    admin = db_session.query(User).filter(User.username == "adminuser").first()
    admin_token = create_access_token({"sub": admin.id, "role": admin.role})

    response = client.get(
        "/api/v1/admin/reports/daily-transactions?format=csv",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment" in response.headers["content-disposition"]


def test_get_regulatory_report_pdf(client: TestClient, db_session: Session):
    admin = db_session.query(User).filter(User.username == "adminuser").first()
    admin_token = create_access_token({"sub": admin.id, "role": admin.role})

    response = client.get(
        "/api/v1/admin/reports/daily-transactions?format=pdf",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment" in response.headers["content-disposition"]


def test_list_incidents(client: TestClient, db_session: Session):
    admin = db_session.query(User).filter(User.username == "adminuser").first()
    admin_token = create_access_token({"sub": admin.id, "role": admin.role})

    # Create incident
    incident = Incident(
        id="incident-id",
        timestamp=datetime.now(timezone.utc),
        severity="CRITICAL",
        endpoint="/api/v1/auth/login",
        error_type="ValueError",
        message="Test error message",
        correlation_id="correlation-id",
    )
    db_session.add(incident)
    db_session.commit()

    response = client.get(
        "/api/v1/admin/incidents", headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["error_type"] == "ValueError"
