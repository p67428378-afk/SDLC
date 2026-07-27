import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from server.models.audit import AuditLog


def log_audit_event(
    db: Session,
    event_type: str,
    actor: str,
    resource: str,
    ip_address: str,
    status: str,
    details: dict,
) -> AuditLog:
    """
    Creates an AuditLog entry and adds it to the DB session.
    The caller (route handler) is responsible for committing the transaction.
    """
    audit_entry = AuditLog(
        id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc),
        event_type=event_type,
        actor=actor,
        resource=resource,
        ip_address=ip_address,
        status=status,
        details=details,
    )
    db.add(audit_entry)
    return audit_entry
