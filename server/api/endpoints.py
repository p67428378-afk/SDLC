from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
import os
import io

from server.database import get_db, verify_password
from server import crud, schemas, models

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
    # Return a mock PDF file
    pdf_content = b"%PDF-1.4\n%Mock Statement Content for " + filename.encode("utf-8")
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

    # Check for potential fraud (e.g., amount >= 10000)
    if transfer_data.amount >= 10000.00:
        crud.create_fraud_alert(
            db,
            transaction_id=transaction.id,
            rule_triggered="Large Transaction Amount",
            risk_score=85,
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
    current_user: models.User = Depends(require_admin),
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
    current_user: models.User = Depends(require_admin),
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
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    account = crud.get_account_by_id(db, account_id=accountId)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    updated_account = crud.suspend_account(db, account_id=accountId)

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
