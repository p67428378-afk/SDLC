import uuid
import hashlib
import json
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, text
from server.models import User, Account, Transaction, Statement, AuditLog, FraudAlert
from server.database import get_password_hash


def calculate_audit_hash(
    user_id: str,
    event_type: str,
    event_details: dict,
    source_ip: str,
    timestamp: datetime,
    previous_hash: str,
) -> str:
    timestamp_str = timestamp.isoformat()
    details_str = json.dumps(event_details, sort_keys=True)
    payload = f"{user_id}|{event_type}|{details_str}|{source_ip}|{timestamp_str}|{previous_hash or ''}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def get_all_transactions_by_account_id(
    db: Session,
    account_id: str,
    search: str = None,
    start_date: str = None,
    end_date: str = None,
    type: str = None,
):
    query = db.query(Transaction).filter(
        or_(
            Transaction.source_account_id == account_id,
            Transaction.destination_account_id == account_id,
        )
    )

    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))

    if type:
        query = query.filter(Transaction.type == type)

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(Transaction.transaction_date >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(Transaction.transaction_date <= end_dt)
        except ValueError:
            pass

    return query.order_by(Transaction.transaction_date.desc()).all()


# User CRUD
def get_user_by_id(db: Session, user_id: str):
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user_data) -> User:
    db_user = User(
        id=str(uuid.uuid4()),
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role="customer",
        is_active=True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user_profile(db: Session, user_id: str, email: str, full_name: str) -> User:
    db_user = get_user_by_id(db, user_id)
    if db_user:
        db_user.email = email
        db_user.full_name = full_name
        db_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
    return db_user


def update_user_preferences(
    db: Session,
    user_id: str,
    email_alerts: bool,
    sms_alerts: bool,
    min_alert_amount: float,
) -> User:
    db_user = get_user_by_id(db, user_id)
    if db_user:
        db_user.email_alerts = email_alerts
        db_user.sms_alerts = sms_alerts
        db_user.min_alert_amount = min_alert_amount
        db_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
    return db_user


# Account CRUD
def get_accounts_by_user_id(db: Session, user_id: str):
    return db.query(Account).filter(Account.user_id == user_id).all()


def get_account_by_id(db: Session, account_id: str) -> Account:
    return db.query(Account).filter(Account.id == account_id).first()


def get_account_by_number(db: Session, account_number: str) -> Account:
    return db.query(Account).filter(Account.account_number == account_number).first()


def suspend_account(db: Session, account_id: str) -> Account:
    db_account = get_account_by_id(db, account_id)
    if db_account:
        db_account.status = "suspended"
        db_account.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_account)
    return db_account


# Statement CRUD
def get_statements_by_account_id(db: Session, account_id: str):
    return db.query(Statement).filter(Statement.account_id == account_id).all()


# Transaction CRUD
def get_transactions_by_account_id(
    db: Session,
    account_id: str,
    skip: int = 0,
    limit: int = 20,
    search: str = None,
    start_date: str = None,
    end_date: str = None,
    type: str = None,
):
    query = db.query(Transaction).filter(
        or_(
            Transaction.source_account_id == account_id,
            Transaction.destination_account_id == account_id,
        )
    )

    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))

    if type:
        query = query.filter(Transaction.type == type)

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(Transaction.transaction_date >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(Transaction.transaction_date <= end_dt)
        except ValueError:
            pass

    total = query.count()
    items = (
        query.order_by(Transaction.transaction_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total


def create_transaction(
    db: Session,
    source_account_id: str,
    destination_account_id: str,
    amount: float,
    type: str,
    description: str,
    status: str = "Completed",
) -> Transaction:
    db_transaction = Transaction(
        id=str(uuid.uuid4()),
        source_account_id=source_account_id,
        destination_account_id=destination_account_id,
        amount=amount,
        type=type,
        description=description,
        status=status,
        transaction_date=datetime.utcnow(),
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


# Audit Log CRUD
def create_audit_log(
    db: Session, user_id: str, event_type: str, event_details: dict, source_ip: str
) -> AuditLog:
    # Concurrency control: serialize write operations to audit_log
    if db.bind.dialect.name == "postgresql":
        db.execute(text("LOCK TABLE audit_log IN EXCLUSIVE MODE"))

    # Get the most recent audit log entry
    last_log = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc(), AuditLog.id.desc())
        .first()
    )
    previous_hash = last_log.current_hash if last_log else None

    timestamp = datetime.utcnow()
    current_hash = calculate_audit_hash(
        user_id=user_id,
        event_type=event_type,
        event_details=event_details,
        source_ip=source_ip,
        timestamp=timestamp,
        previous_hash=previous_hash,
    )

    db_log = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        event_type=event_type,
        event_details=event_details,
        source_ip=source_ip,
        timestamp=timestamp,
        previous_hash=previous_hash,
        current_hash=current_hash,
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


def verify_audit_chain(db: Session):
    logs = (
        db.query(AuditLog).order_by(AuditLog.timestamp.asc(), AuditLog.id.asc()).all()
    )
    expected_prev_hash = None
    for log in logs:
        if log.previous_hash != expected_prev_hash:
            return {
                "is_intact": False,
                "first_tampered_record_id": log.id,
                "details": f"Record {log.id} previous_hash mismatch. Expected {expected_prev_hash}, got {log.previous_hash}",
            }
        calculated_hash = calculate_audit_hash(
            user_id=log.user_id,
            event_type=log.event_type,
            event_details=log.event_details,
            source_ip=log.source_ip,
            timestamp=log.timestamp,
            previous_hash=log.previous_hash,
        )
        if log.current_hash != calculated_hash:
            return {
                "is_intact": False,
                "first_tampered_record_id": log.id,
                "details": f"Record {log.id} current_hash mismatch. Calculated {calculated_hash}, got {log.current_hash}",
            }
        expected_prev_hash = log.current_hash
    return {"is_intact": True, "first_tampered_record_id": None, "details": None}


def get_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    user_id: str = None,
    event_type: str = None,
    start_date: str = None,
    end_date: str = None,
):
    query = db.query(AuditLog)

    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    if event_type:
        query = query.filter(AuditLog.event_type == event_type)

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(AuditLog.timestamp >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(AuditLog.timestamp <= end_dt)
        except ValueError:
            pass

    total = query.count()
    items = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return items, total


# Fraud Alert CRUD
def get_fraud_alerts(db: Session, skip: int = 0, limit: int = 20, status: str = None):
    query = db.query(FraudAlert)

    if status:
        query = query.filter(FraudAlert.status == status)

    total = query.count()
    items = query.order_by(FraudAlert.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def create_fraud_alert(
    db: Session, transaction_id: str, rule_triggered: str, risk_score: int
) -> FraudAlert:
    db_alert = FraudAlert(
        id=str(uuid.uuid4()),
        transaction_id=transaction_id,
        rule_triggered=rule_triggered,
        risk_score=risk_score,
        status="open",
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert
