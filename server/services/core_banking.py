import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from server.models.banking import Account, Transaction
from server.models.risk import RiskSignal
from server.models.alert import AlertPreference
from server.models.session import Session as UserSession
from server.utils.notifications import send_notification


def evaluate_transaction_risk(
    db: Session,
    user_id: str,
    amount: Decimal,
    destination_account: str,
    ip_address: str,
) -> int:
    """
    Evaluates transaction risk using a configurable rules engine.
    Returns the computed risk score.
    """
    triggered_rules = []
    risk_score = 0

    # 1. Large Amount Rule
    # Get user's large transaction threshold or default to 5000
    pref = db.query(AlertPreference).filter(AlertPreference.user_id == user_id).first()
    large_threshold = Decimal("5000.00")
    if pref:
        large_threshold = pref.large_transaction_threshold

    if amount >= large_threshold:
        triggered_rules.append("Large Transaction Amount")
        risk_score += 30

    # 2. Rapid Succession / Velocity Rule
    # Check if user has > 3 transactions in the last 5 minutes
    five_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    recent_tx_count = (
        db.query(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .filter(Account.user_id == user_id, Transaction.created_at >= five_minutes_ago)
        .count()
    )
    if recent_tx_count >= 3:
        triggered_rules.append("Rapid Succession / Velocity Pattern")
        risk_score += 25

    # 3. Newly-seen Destination Account Rule
    # Check if destination_account has been transferred to before
    past_tx = (
        db.query(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .filter(
            Account.user_id == user_id,
            Transaction.description.contains(destination_account),
        )
        .first()
    )
    if not past_tx:
        triggered_rules.append("Transfer to Newly-seen Destination Account")
        risk_score += 20

    # 4. Off-hours Activity Rule
    # Check if transaction is between 11 PM and 5 AM UTC
    current_hour = datetime.now(timezone.utc).hour
    if current_hour >= 23 or current_hour < 5:
        triggered_rules.append("Unusual Off-hours Activity")
        risk_score += 15

    # 5. Unusual Source IP Rule
    # Check if ip_address is different from the user's last 3 sessions
    last_sessions = (
        db.query(UserSession)
        .filter(UserSession.user_id == user_id)
        .order_by(UserSession.last_active_at.desc())
        .limit(3)
        .all()
    )
    past_ips = [s.ip_address for s in last_sessions]
    if ip_address not in past_ips and len(past_ips) > 0:
        triggered_rules.append("Unusual Source IP Address")
        risk_score += 10

    # Cap risk score at 100
    risk_score = min(risk_score, 100)

    if triggered_rules:
        signal = RiskSignal(
            id=str(uuid.uuid4()),
            user_id=user_id,
            risk_score=risk_score,
            signal_type="TRANSACTION_RISK",
            details={
                "amount": float(amount),
                "destination_account": destination_account,
                "ip_address": ip_address,
                "triggered_rules": triggered_rules,
            },
            timestamp=datetime.now(timezone.utc),
        )
        db.add(signal)

        # Send security alert
        send_notification(
            db,
            user_id=user_id,
            alert_type="SECURITY_ALERT",
            message=f"Suspicious transaction activity detected: {', '.join(triggered_rules)}. Risk Score: {risk_score}.",
        )

    return risk_score
