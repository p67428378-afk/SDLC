from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional, Any
import os
import io
import re
import csv
import asyncio

from server.database import get_db, verify_password
from server import crud, schemas, models
from server.utils.broker import broker, publish_event_sync
from server.utils.pdf import generate_pdf_statement


async def sse_generator(user_id: str, is_admin: bool):
    channels = [f"user:{user_id}"]
    if is_admin:
        channels.append("admin")

    subscription = broker.subscribe(channels)
    try:
        while True:
            try:
                message = await asyncio.wait_for(subscription.__anext__(), timeout=15.0)
                yield f"data: {message}\n\n"
            except StopAsyncIteration:
                break
            except asyncio.TimeoutError:
                yield ": ping\n\n"
    except asyncio.CancelledError:
        pass


router = APIRouter(prefix="/api/v1/banking")

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Helper to log audit events
def log_audit_event(
    db: Session, user_id: str, event_type: str, event_details: dict, request: Request
):
    source_ip = request.client.host if request.client else "127.0.0.1"
    crud.create_audit_log(db, user_id, event_type, event_details, source_ip)


# Dependency to get current user
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    user = crud.get_user_by_id(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended",
        )
    return user


# Dependency to require admin role
def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [
        "admin",
        "system_admin",
        "support_admin",
        "fraud_analyst",
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized (Admin only)",
        )
    return current_user


def require_system_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized (System Admin only)",
        )
    return current_user


def require_fraud_analyst_or_above(
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ["admin", "system_admin", "fraud_analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized (Fraud Analyst or System Admin only)",
        )
    return current_user


def require_support_or_above(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [
        "admin",
        "system_admin",
        "support_admin",
        "fraud_analyst",
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )
    return current_user


# Auth Endpoints
@router.post(
    "/auth/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: schemas.UserRegister, request: Request, db: Session = Depends(get_db)
):
    db_user = crud.get_user_by_username(db, username=user_data.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    db_user = crud.get_user_by_email(db, email=user_data.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    user = crud.create_user(db, user_data)
    log_audit_event(
        db,
        user.id,
        "USER_REGISTER",
        {"username": user.username, "email": user.email},
        request,
    )
    return user


@router.post("/auth/login", response_model=schemas.LoginResponse)
def login(
    login_data: schemas.UserLogin, request: Request, db: Session = Depends(get_db)
):
    user = crud.get_user_by_username(db, username=login_data.username)
    if not user:
        user = crud.get_user_by_email(db, email=login_data.username)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is suspended")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role}, expires_delta=access_token_expires
    )

    log_audit_event(db, user.id, "USER_LOGIN", {"username": user.username}, request)
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/auth/logout")
def logout(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log_audit_event(
        db, current_user.id, "USER_LOGOUT", {"username": current_user.username}, request
    )
    return {"detail": "Successfully logged out"}


@router.get("/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# Accounts Endpoints
@router.get("/accounts", response_model=List[schemas.AccountResponse])
def get_accounts(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    accounts = crud.get_accounts_by_user_id(db, user_id=current_user.id)
    log_audit_event(
        db, current_user.id, "VIEW_ACCOUNTS", {"count": len(accounts)}, request
    )
    return accounts


@router.get("/accounts/{accountId}", response_model=schemas.AccountResponse)
def get_account_details(
    accountId: str,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = crud.get_account_by_id(db, account_id=accountId)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.user_id != current_user.id and current_user.role not in [
        "admin",
        "system_admin",
        "support_admin",
    ]:
        raise HTTPException(status_code=403, detail="Not authorized")
    log_audit_event(
        db, current_user.id, "VIEW_ACCOUNT_DETAILS", {"account_id": accountId}, request
    )
    return account


@router.get(
    "/accounts/{accountId}/statements", response_model=List[schemas.StatementResponse]
)
def get_account_statements(
    accountId: str,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = crud.get_account_by_id(db, account_id=accountId)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.user_id != current_user.id and current_user.role not in [
        "admin",
        "system_admin",
        "support_admin",
    ]:
        raise HTTPException(status_code=403, detail="Not authorized")
    statements = crud.get_statements_by_account_id(db, account_id=accountId)
    log_audit_event(
        db,
        current_user.id,
        "VIEW_STATEMENTS",
        {"account_id": accountId, "count": len(statements)},
        request,
    )
    return statements


@router.get("/statements/{filename}")
def download_statement(
    filename: str,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    match = re.search(r"(\d{4})[-_](\d{2})", filename)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid statement filename format")
    year, month = match.groups()
    statement_period = f"{year}-{month}"

    statement = (
        db.query(models.Statement)
        .filter(models.Statement.file_name == filename)
        .first()
    )
    if not statement:
        accounts = crud.get_accounts_by_user_id(db, user_id=current_user.id)
        if not accounts:
            raise HTTPException(status_code=404, detail="Statement not found")
        account = accounts[0]
    else:
        account = crud.get_account_by_id(db, account_id=statement.account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

    if account.user_id != current_user.id and current_user.role not in [
        "admin",
        "system_admin",
        "support_admin",
    ]:
        raise HTTPException(status_code=403, detail="Not authorized")

    start_of_month = datetime(int(year), int(month), 1)
    end_of_month = (
        datetime(int(year) + 1, 1, 1)
        if int(month) == 12
        else datetime(int(year), int(month) + 1, 1)
    )

    from sqlalchemy import or_

    future_transactions = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.transaction_date >= start_of_month,
            or_(
                models.Transaction.source_account_id == account.id,
                models.Transaction.destination_account_id == account.id,
            ),
        )
        .all()
    )

    current_balance = float(account.balance)
    balance_at_start = current_balance
    for t in future_transactions:
        if t.status != "Completed":
            continue
        if t.source_account_id == account.id:
            balance_at_start += float(t.amount)
        elif t.destination_account_id == account.id:
            balance_at_start -= float(t.amount)

    statement_transactions = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.transaction_date >= start_of_month,
            models.Transaction.transaction_date < end_of_month,
            or_(
                models.Transaction.source_account_id == account.id,
                models.Transaction.destination_account_id == account.id,
            ),
        )
        .order_by(models.Transaction.transaction_date.asc())
        .all()
    )

    opening_balance = balance_at_start
    closing_balance = opening_balance
    for t in statement_transactions:
        if t.status != "Completed":
            continue
        if t.source_account_id == account.id:
            closing_balance -= float(t.amount)
        elif t.destination_account_id == account.id:
            closing_balance += float(t.amount)

    pdf_content = generate_pdf_statement(
        account_id=account.id,
        account_holder=account.user.full_name,
        account_number=account.account_number,
        statement_period=statement_period,
        opening_balance=opening_balance,
        closing_balance=closing_balance,
        transactions=statement_transactions,
    )

    log_audit_event(
        db, current_user.id, "DOWNLOAD_STATEMENT", {"filename": filename}, request
    )
    return StreamingResponse(
        io.BytesIO(pdf_content),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# Profile & Preferences Endpoints
@router.put("/profile", response_model=schemas.UserResponse)
def update_profile(
    profile_data: schemas.ProfileUpdate,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check if email is already in use by another user
    existing_user = crud.get_user_by_email(db, email=profile_data.email)
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(
            status_code=400, detail="Invalid email format or email already in use"
        )

    updated_user = crud.update_user_profile(
        db,
        user_id=current_user.id,
        email=profile_data.email,
        full_name=profile_data.full_name,
    )
    log_audit_event(
        db,
        current_user.id,
        "PROFILE_UPDATE",
        {"old_email": current_user.email, "new_email": profile_data.email},
        request,
    )
    return updated_user


@router.put("/preferences", response_model=schemas.PreferencesResponse)
def update_preferences(
    pref_data: schemas.PreferencesUpdate,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated_user = crud.update_user_preferences(
        db,
        user_id=current_user.id,
        email_alerts=pref_data.email_alerts,
        sms_alerts=pref_data.sms_alerts,
        min_alert_amount=pref_data.min_alert_amount,
    )
    log_audit_event(
        db, current_user.id, "PREFERENCES_UPDATE", pref_data.model_dump(), request
    )
    return updated_user


# Transactions Endpoints
@router.get(
    "/accounts/{accountId}/transactions",
    response_model=schemas.TransactionHistoryResponse,
)
def get_transaction_history(
    accountId: str,
    request: Request,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    type: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = crud.get_account_by_id(db, account_id=accountId)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.user_id != current_user.id and current_user.role not in [
        "admin",
        "system_admin",
        "support_admin",
    ]:
        raise HTTPException(status_code=403, detail="Not authorized")

    items, total = crud.get_transactions_by_account_id(
        db,
        account_id=accountId,
        skip=skip,
        limit=limit,
        search=search,
        start_date=start_date,
        end_date=end_date,
        type=type,
    )
    log_audit_event(
        db,
        current_user.id,
        "VIEW_TRANSACTIONS",
        {"account_id": accountId, "count": len(items)},
        request,
    )
    return {
        "items": items,
        "page": (skip // limit) + 1 if limit > 0 else 1,
        "total": total,
    }


@router.post("/transfers", response_model=schemas.TransferResponse)
def transfer_funds(
    transfer_data: schemas.TransferRequest,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    source_account = crud.get_account_by_id(
        db, account_id=transfer_data.source_account_id
    )
    if not source_account:
        raise HTTPException(status_code=404, detail="Account not found")
    if source_account.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if source_account.status == "suspended":
        raise HTTPException(status_code=400, detail="Source account is suspended")

    destination_account = crud.get_account_by_number(
        db, account_number=transfer_data.destination_account_number
    )
    if not destination_account:
        raise HTTPException(
            status_code=400, detail="Insufficient funds or invalid destination account"
        )

    if destination_account.user_id != current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Transfers to external payees are not supported in this version",
        )

    if destination_account.status == "suspended":
        raise HTTPException(status_code=400, detail="Destination account is suspended")

    if float(source_account.balance) < transfer_data.amount:
        raise HTTPException(
            status_code=400, detail="Insufficient funds or invalid destination account"
        )

    # Perform transfer
    source_account.balance = float(source_account.balance) - transfer_data.amount
    destination_account.balance = (
        float(destination_account.balance) + transfer_data.amount
    )

    transaction = crud.create_transaction(
        db,
        source_account_id=source_account.id,
        destination_account_id=destination_account.id,
        amount=transfer_data.amount,
        type="transfer",
        description=transfer_data.description,
        status="Completed",
    )

    # Publish events
    tx_data = {
        "id": transaction.id,
        "source_account_id": transaction.source_account_id,
        "destination_account_id": transaction.destination_account_id,
        "amount": float(transaction.amount),
        "type": transaction.type,
        "description": transaction.description,
        "status": transaction.status,
        "transaction_date": transaction.transaction_date.isoformat(),
    }
    publish_event_sync(
        f"user:{source_account.user_id}", {"event": "new_transaction", "data": tx_data}
    )
    publish_event_sync(
        f"user:{source_account.user_id}",
        {
            "event": "balance_update",
            "data": {
                "account_id": source_account.id,
                "balance": float(source_account.balance),
            },
        },
    )
    publish_event_sync(
        f"user:{destination_account.user_id}",
        {"event": "new_transaction", "data": tx_data},
    )
    publish_event_sync(
        f"user:{destination_account.user_id}",
        {
            "event": "balance_update",
            "data": {
                "account_id": destination_account.id,
                "balance": float(destination_account.balance),
            },
        },
    )

    # Check for potential fraud (e.g., amount >= 10000)
    if transfer_data.amount >= 10000.00:
        alert = crud.create_fraud_alert(
            db,
            transaction_id=transaction.id,
            rule_triggered="Large Transaction Amount",
            risk_score=85,
        )
        # Publish fraud alert to admins
        publish_event_sync(
            "admin",
            {
                "event": "new_fraud_alert",
                "data": {
                    "id": alert.id,
                    "transaction_id": alert.transaction_id,
                    "rule_triggered": alert.rule_triggered,
                    "risk_score": alert.risk_score,
                    "status": alert.status,
                    "created_at": alert.created_at.isoformat(),
                },
            },
        )
        log_audit_event(
            db,
            current_user.id,
            "FRAUD_ALERT_TRIGGERED",
            {"transaction_id": transaction.id, "amount": transfer_data.amount},
            request,
        )

    log_audit_event(
        db,
        current_user.id,
        "FUNDS_TRANSFER",
        {
            "transaction_id": transaction.id,
            "source_account": source_account.account_number,
            "destination_account": destination_account.account_number,
            "amount": transfer_data.amount,
        },
        request,
    )

    return transaction


# Admin Endpoints
@router.get("/admin/audit-trail", response_model=schemas.AuditTrailResponse)
def get_audit_trail(
    skip: int = 0,
    limit: int = 20,
    user_id: Optional[str] = None,
    event_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    current_user: models.User = Depends(require_system_admin),
    db: Session = Depends(get_db),
):
    items, total = crud.get_audit_logs(
        db,
        skip=skip,
        limit=limit,
        user_id=user_id,
        event_type=event_type,
        start_date=start_date,
        end_date=end_date,
        search=search,
    )
    return {
        "items": items,
        "page": (skip // limit) + 1 if limit > 0 else 1,
        "total": total,
    }


@router.get("/admin/fraud-alerts", response_model=schemas.FraudAlertsResponse)
def get_fraud_alerts_endpoint(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    current_user: models.User = Depends(require_fraud_analyst_or_above),
    db: Session = Depends(get_db),
):
    items, total = crud.get_fraud_alerts(db, skip=skip, limit=limit, status=status)
    return {
        "items": items,
        "page": (skip // limit) + 1 if limit > 0 else 1,
        "total": total,
    }


@router.post(
    "/admin/accounts/{accountId}/suspend", response_model=schemas.SuspendResponse
)
def suspend_customer_account(
    accountId: str,
    suspend_data: schemas.SuspendRequest,
    request: Request,
    current_user: models.User = Depends(require_fraud_analyst_or_above),
    db: Session = Depends(get_db),
):
    account = crud.get_account_by_id(db, account_id=accountId)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    updated_account = crud.suspend_account(db, account_id=accountId)

    # Publish event
    publish_event_sync(
        f"user:{updated_account.user_id}",
        {
            "event": "balance_update",
            "data": {
                "account_id": updated_account.id,
                "balance": float(updated_account.balance),
                "status": updated_account.status,
            },
        },
    )

    # Also suspend the user associated with the account to block login if needed,
    # or just suspend the account. The requirement says: "have the power to temporarily block or suspend the source account to avoid any malicious activity to occur."
    # Let's also log this administrative action
    log_audit_event(
        db,
        current_user.id,
        "ADMIN_SUSPEND_ACCOUNT",
        {"suspended_account_id": accountId, "reason": suspend_data.reason},
        request,
    )

    return {
        "id": updated_account.id,
        "status": updated_account.status,
        "updated_at": updated_account.updated_at,
    }


@router.get("/stream")
async def stream_events(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_admin = current_user.role in [
        "admin",
        "system_admin",
        "support_admin",
        "fraud_analyst",
    ]
    return StreamingResponse(
        sse_generator(current_user.id, is_admin),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/accounts/{accountId}/transactions/export")
def export_transactions(
    accountId: str,
    format: str,
    request: Request,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    type: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if format != "csv":
        raise HTTPException(status_code=400, detail="Format must be csv")

    account = crud.get_account_by_id(db, account_id=accountId)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.user_id != current_user.id and current_user.role not in [
        "admin",
        "system_admin",
        "support_admin",
    ]:
        raise HTTPException(status_code=403, detail="Not authorized")

    transactions = crud.get_all_transactions_by_account_id(
        db,
        account_id=accountId,
        search=search,
        start_date=start_date,
        end_date=end_date,
        type=type,
    )

    # Log EXPORT_TRANSACTIONS audit event
    log_audit_event(
        db,
        current_user.id,
        "EXPORT_TRANSACTIONS",
        {"account_id": accountId, "count": len(transactions)},
        request,
    )

    def sanitize_csv_field(val: Any) -> str:
        if val is None:
            return ""
        s = str(val)
        if s and s[0] in ("=", "+", "-", "@"):
            return "'" + s
        return s

    def generate_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "Transaction ID",
                "Source Account",
                "Destination Account",
                "Amount",
                "Type",
                "Description",
                "Status",
                "Date",
            ]
        )
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)

        for t in transactions:
            writer.writerow(
                [
                    sanitize_csv_field(t.id),
                    sanitize_csv_field(
                        t.source_account.account_number if t.source_account else ""
                    ),
                    sanitize_csv_field(
                        t.destination_account.account_number
                        if t.destination_account
                        else ""
                    ),
                    sanitize_csv_field(t.amount),
                    sanitize_csv_field(t.type),
                    sanitize_csv_field(t.description),
                    sanitize_csv_field(t.status),
                    sanitize_csv_field(t.transaction_date.isoformat()),
                ]
            )
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    return StreamingResponse(
        generate_csv(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=transactions-{accountId}.csv"
        },
    )


@router.get(
    "/admin/audit-trail/verify", response_model=schemas.AuditTrailVerifyResponse
)
def verify_audit_trail(
    current_user: models.User = Depends(require_system_admin),
    db: Session = Depends(get_db),
):
    result = crud.verify_audit_chain(db)
    return result


@router.get("/admin/audit-trail/export")
def export_audit_trail(
    format: str,
    request: Request,
    user_id: Optional[str] = None,
    event_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    current_user: models.User = Depends(require_system_admin),
    db: Session = Depends(get_db),
):
    if format != "csv":
        raise HTTPException(status_code=400, detail="Format must be csv")

    # Fetch all matching audit logs (no pagination)
    items, _ = crud.get_audit_logs(
        db,
        skip=0,
        limit=1000000,
        user_id=user_id,
        event_type=event_type,
        start_date=start_date,
        end_date=end_date,
        search=search,
    )

    # Log EXPORT_AUDIT audit event
    log_audit_event(
        db,
        current_user.id,
        "EXPORT_AUDIT",
        {
            "user_id_filter": user_id,
            "event_type_filter": event_type,
            "start_date_filter": start_date,
            "end_date_filter": end_date,
            "search_filter": search,
            "count": len(items),
        },
        request,
    )

    def sanitize_csv_field(val: Any) -> str:
        if val is None:
            return ""
        s = str(val)
        if s and s[0] in ("=", "+", "-", "@"):
            return "'" + s
        return s

    def generate_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "Audit ID",
                "User ID",
                "Event Type",
                "Event Details",
                "Source IP",
                "Timestamp",
                "Previous Hash",
                "Current Hash",
            ]
        )
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)

        for log in items:
            import json

            details_str = json.dumps(log.event_details)
            writer.writerow(
                [
                    sanitize_csv_field(log.id),
                    sanitize_csv_field(log.user_id),
                    sanitize_csv_field(log.event_type),
                    sanitize_csv_field(details_str),
                    sanitize_csv_field(log.source_ip),
                    sanitize_csv_field(log.timestamp.isoformat()),
                    sanitize_csv_field(log.previous_hash),
                    sanitize_csv_field(log.current_hash),
                ]
            )
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    return StreamingResponse(
        generate_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit-trail.csv"},
    )


@router.patch(
    "/admin/fraud-alerts/{alertId}", response_model=schemas.FraudAlertResponse
)
def update_fraud_alert_endpoint(
    alertId: str,
    alert_data: schemas.FraudAlertUpdateRequest,
    request: Request,
    current_user: models.User = Depends(require_fraud_analyst_or_above),
    db: Session = Depends(get_db),
):
    alert = db.query(models.FraudAlert).filter(models.FraudAlert.id == alertId).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Fraud alert not found")

    updated_alert = crud.update_fraud_alert(
        db, alert_id=alertId, status=alert_data.status, note=alert_data.note
    )

    # Log audit event
    event_type = (
        "RESOLVE_FRAUD_ALERT"
        if alert_data.status == "resolved"
        else "DISMISS_FRAUD_ALERT"
    )
    if alert_data.status not in ["resolved", "dismissed"]:
        event_type = "UPDATE_FRAUD_ALERT"

    log_audit_event(
        db,
        current_user.id,
        event_type,
        {
            "fraud_alert_id": alertId,
            "status": alert_data.status,
            "note": alert_data.note,
        },
        request,
    )

    return updated_alert


@router.get("/admin/customers/{userId}", response_model=schemas.CustomerDetailResponse)
def get_customer_detail(
    userId: str,
    request: Request,
    current_user: models.User = Depends(require_support_or_above),
    db: Session = Depends(get_db),
):
    user = crud.get_user_by_id(db, user_id=userId)
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    accounts = crud.get_accounts_by_user_id(db, user_id=userId)

    # Get recent transactions for all accounts of this user
    account_ids = [acc.id for acc in accounts]
    from sqlalchemy import or_

    recent_transactions = []
    if account_ids:
        recent_transactions = (
            db.query(models.Transaction)
            .filter(
                or_(
                    models.Transaction.source_account_id.in_(account_ids),
                    models.Transaction.destination_account_id.in_(account_ids),
                )
            )
            .order_by(models.Transaction.transaction_date.desc())
            .limit(50)
            .all()
        )

    # Get audit events for this user
    audit_events = (
        db.query(models.AuditLog)
        .filter(models.AuditLog.user_id == userId)
        .order_by(models.AuditLog.timestamp.desc())
        .limit(50)
        .all()
    )

    log_audit_event(
        db,
        current_user.id,
        "ADMIN_VIEW_CUSTOMER",
        {"viewed_user_id": userId},
        request,
    )

    return {
        "profile": user,
        "accounts": accounts,
        "recent_transactions": recent_transactions,
        "audit_events": audit_events,
    }


@router.get("/admin/accounts/{accountId}", response_model=schemas.AccountDetailResponse)
def get_admin_account_detail(
    accountId: str,
    request: Request,
    current_user: models.User = Depends(require_support_or_above),
    db: Session = Depends(get_db),
):
    account = crud.get_account_by_id(db, account_id=accountId)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    owner = crud.get_user_by_id(db, user_id=account.user_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Account owner not found")

    from sqlalchemy import or_

    recent_transactions = (
        db.query(models.Transaction)
        .filter(
            or_(
                models.Transaction.source_account_id == accountId,
                models.Transaction.destination_account_id == accountId,
            )
        )
        .order_by(models.Transaction.transaction_date.desc())
        .limit(50)
        .all()
    )

    log_audit_event(
        db,
        current_user.id,
        "ADMIN_VIEW_ACCOUNT",
        {"viewed_account_id": accountId},
        request,
    )

    return {
        "account": account,
        "owner": owner,
        "recent_transactions": recent_transactions,
    }


@router.post(
    "/admin/accounts/{accountId}/reactivate", response_model=schemas.SuspendResponse
)
def reactivate_customer_account(
    accountId: str,
    reactivate_data: schemas.ReactivateRequest,
    request: Request,
    current_user: models.User = Depends(require_fraud_analyst_or_above),
    db: Session = Depends(get_db),
):
    account = crud.get_account_by_id(db, account_id=accountId)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    updated_account = crud.reactivate_account(db, account_id=accountId)

    # Publish event
    publish_event_sync(
        f"user:{updated_account.user_id}",
        {
            "event": "balance_update",
            "data": {
                "account_id": updated_account.id,
                "balance": float(updated_account.balance),
                "status": updated_account.status,
            },
        },
    )

    log_audit_event(
        db,
        current_user.id,
        "ADMIN_REACTIVATE_ACCOUNT",
        {"reactivated_account_id": accountId, "reason": reactivate_data.reason},
        request,
    )

    return {
        "id": updated_account.id,
        "status": updated_account.status,
        "updated_at": updated_account.updated_at,
    }


@router.post(
    "/admin/accounts/{accountId}/close", response_model=schemas.SuspendResponse
)
def close_customer_account(
    accountId: str,
    close_data: schemas.CloseRequest,
    request: Request,
    current_user: models.User = Depends(require_system_admin),
    db: Session = Depends(get_db),
):
    account = crud.get_account_by_id(db, account_id=accountId)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    updated_account = crud.close_account(db, account_id=accountId)

    # Publish event
    publish_event_sync(
        f"user:{updated_account.user_id}",
        {
            "event": "balance_update",
            "data": {
                "account_id": updated_account.id,
                "balance": float(updated_account.balance),
                "status": updated_account.status,
            },
        },
    )

    log_audit_event(
        db,
        current_user.id,
        "ADMIN_CLOSE_ACCOUNT",
        {"closed_account_id": accountId, "reason": close_data.reason},
        request,
    )

    return {
        "id": updated_account.id,
        "status": updated_account.status,
        "updated_at": updated_account.updated_at,
    }


@router.get("/admin/summary", response_model=schemas.AdminSummaryResponse)
def get_admin_summary(
    request: Request,
    current_user: models.User = Depends(require_support_or_above),
    db: Session = Depends(get_db),
):
    total_customers = (
        db.query(models.User).filter(models.User.role == "customer").count()
    )
    open_fraud_alerts = (
        db.query(models.FraudAlert).filter(models.FraudAlert.status == "open").count()
    )
    suspended_accounts = (
        db.query(models.Account).filter(models.Account.status == "suspended").count()
    )

    now = datetime.utcnow()
    twenty_four_hours_ago = now - timedelta(hours=24)
    transactions_24h = (
        db.query(models.Transaction)
        .filter(models.Transaction.transaction_date >= twenty_four_hours_ago)
        .count()
    )

    verify_result = crud.verify_audit_chain(db)
    audit_chain_intact = verify_result.get("is_intact", True)

    log_audit_event(
        db,
        current_user.id,
        "ADMIN_VIEW_SUMMARY",
        {},
        request,
    )

    return {
        "total_customers": total_customers,
        "open_fraud_alerts": open_fraud_alerts,
        "suspended_accounts": suspended_accounts,
        "transactions_24h": transactions_24h,
        "audit_chain_intact": audit_chain_intact,
    }
