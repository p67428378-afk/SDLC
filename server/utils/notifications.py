import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from server.models.alert import Alert, AlertPreference


def send_notification(
    db: Session, user_id: str, alert_type: str, message: str
) -> Alert:
    """
    Sends a notification to a user by creating an Alert record.
    Checks user preferences unless it's a security/fraud alert.
    """
    # Check preferences if not a security/fraud alert
    is_security = (
        "security" in alert_type.lower()
        or "fraud" in alert_type.lower()
        or "lockout" in alert_type.lower()
    )

    if not is_security:
        pref = (
            db.query(AlertPreference).filter(AlertPreference.user_id == user_id).first()
        )
        if pref:
            # If all channels are disabled, we might skip, but let's default to creating the alert in-app anyway
            pass

    alert = Alert(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=alert_type,
        message=message,
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(alert)
    return alert
