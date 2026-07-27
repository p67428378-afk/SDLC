import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from server.database import get_db
from server.models.banking import Account, Transaction, Payee
from server.models.user import User
from server.schemas.banking import (
    AccountResponse,
    TransactionListResponse,
    InternalTransferRequest,
    InternalTransferResponse,
    ExternalTransferRequest,
    ExternalTransferResponse,
    PayeeRequest,
    PayeeResponse,
    PayeeVerifyRequest,
    LimitsResponse,
)
from server.utils.security import get_current_user
from server.utils.audit import log_audit_event
from server.utils.idempotency import check_idempotency_key
from server.services.core_banking import evaluate_transaction_risk
from server.routers.auth import step_up_sessions
from server.config import settings

router = APIRouter(tags=["banking"])


@router.get("/api/v1/accounts", response_model=List[AccountResponse])
def list_accounts(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    return accounts


@router.get("/api/v1/accounts/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
        )
    return account


@router.get(
    "/api/v1/accounts/{account_id}/transactions", response_model=TransactionListResponse
)
def get_transactions(
    account_id: str,
    amount_max: Optional[float] = None,
    amount_min: Optional[float] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
    payee: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
        )

    query = db.query(Transaction).filter(Transaction.account_id == account_id)

    if amount_max is not None:
        query = query.filter(Transaction.amount <= Decimal(str(amount_max)))
    if amount_min is not None:
        query = query.filter(Transaction.amount >= Decimal(str(amount_min)))
    if date_from:
        try:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
            query = query.filter(Transaction.created_at >= dt_from)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid date_from format. Use YYYY-MM-DD."
            )
    if date_to:
        try:
            dt_to = datetime.strptime(date_to, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            ) + timedelta(days=1)
            query = query.filter(Transaction.created_at < dt_to)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid date_to format. Use YYYY-MM-DD."
            )
    if type:
        query = query.filter(Transaction.type == type)
    if payee:
        query = query.filter(Transaction.description.contains(payee))

    total = query.count()
    items = (
        query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    )

    return TransactionListResponse(items=items, limit=limit, skip=skip, total=total)


@router.post(
    "/api/v1/transfers/internal",
    response_model=InternalTransferResponse,
    status_code=201,
)
def internal_transfer(
    request: Request,
    payload: InternalTransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ip_address = request.client.host if request.client else "127.0.0.1"

    # Check idempotency key
    idempotency_key = request.headers.get("X-Idempotency-Key")
    if idempotency_key and check_idempotency_key(db, idempotency_key):
        # Return existing transaction
        existing_tx = (
            db.query(Transaction)
            .filter(Transaction.reference_id == idempotency_key)
            .first()
        )
        return InternalTransferResponse(
            id=existing_tx.id,
            amount=existing_tx.amount,
            status=existing_tx.status,
            created_at=existing_tx.created_at,
        )

    source = (
        db.query(Account)
        .filter(
            Account.id == payload.source_account_id, Account.user_id == current_user.id
        )
        .first()
    )
    dest = (
        db.query(Account)
        .filter(
            Account.id == payload.destination_account_id,
            Account.user_id == current_user.id,
        )
        .first()
    )

    if not source or not dest:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid source or destination account",
        )

    if source.id == dest.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source and destination accounts must be different",
        )

    if source.available_balance < payload.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient funds"
        )

    # Enforce limits
    if payload.amount > settings.LARGE_TRANSFER_THRESHOLD:
        # Check step-up session
        pass  # Internal transfers don't strictly require step-up unless external, but let's check if needed

    # Execute transfer
    source.balance -= payload.amount
    source.available_balance -= payload.amount
    dest.balance += payload.amount
    dest.available_balance += payload.amount

    tx_id = str(uuid.uuid4())
    ref_id = idempotency_key or str(uuid.uuid4())

    # Create debit transaction
    debit_tx = Transaction(
        id=tx_id,
        account_id=source.id,
        type="transfer_out",
        amount=payload.amount,
        description=f"Internal transfer to {dest.account_type} (...{dest.account_number[-4:]})",
        category="transfers",
        status="completed",
        reference_id=ref_id,
        created_at=datetime.now(timezone.utc),
    )
    # Create credit transaction
    credit_tx = Transaction(
        id=str(uuid.uuid4()),
        account_id=dest.id,
        type="transfer_in",
        amount=payload.amount,
        description=f"Internal transfer from {source.account_type} (...{source.account_number[-4:]})",
        category="transfers",
        status="completed",
        reference_id=ref_id,
        created_at=datetime.now(timezone.utc),
    )

    db.add(debit_tx)
    db.add(credit_tx)

    # Evaluate risk
    evaluate_transaction_risk(
        db, current_user.id, payload.amount, dest.account_number, ip_address
    )

    log_audit_event(
        db,
        "INTERNAL_TRANSFER",
        current_user.username,
        f"transfers/internal/{tx_id}",
        ip_address,
        "SUCCESS",
        {"amount": float(payload.amount)},
    )
    db.commit()

    return InternalTransferResponse(
        id=tx_id,
        amount=payload.amount,
        status="completed",
        created_at=debit_tx.created_at,
    )


@router.post(
    "/api/v1/transfers/external",
    response_model=ExternalTransferResponse,
    status_code=201,
)
def external_transfer(
    request: Request,
    payload: ExternalTransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ip_address = request.client.host if request.client else "127.0.0.1"

    # Check idempotency key
    idempotency_key = request.headers.get("X-Idempotency-Key")
    if idempotency_key and check_idempotency_key(db, idempotency_key):
        existing_tx = (
            db.query(Transaction)
            .filter(Transaction.reference_id == idempotency_key)
            .first()
        )
        return ExternalTransferResponse(
            id=existing_tx.id,
            amount=existing_tx.amount,
            status=existing_tx.status,
            created_at=existing_tx.created_at,
        )

    source = (
        db.query(Account)
        .filter(
            Account.id == payload.source_account_id, Account.user_id == current_user.id
        )
        .first()
    )
    payee = (
        db.query(Payee)
        .filter(
            Payee.id == payload.destination_payee_id, Payee.user_id == current_user.id
        )
        .first()
    )

    if not source or not payee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid source account or payee",
        )

    if payee.status != "verified":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Payee is not verified"
        )

    if source.available_balance < payload.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient funds"
        )

    # Enforce limits
    # Check if transfer is above threshold and requires step-up
    if payload.amount >= Decimal(str(settings.LARGE_TRANSFER_THRESHOLD)):
        if not payload.step_up_session_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Step-up authentication required for large transfers.",
            )
        # Verify step-up session
        session_data = step_up_sessions.get(payload.step_up_session_id)
        if (
            not session_data
            or not session_data.get("verified")
            or session_data.get("user_id") != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid or unverified step-up session.",
            )

    # Execute transfer
    source.balance -= payload.amount
    source.available_balance -= payload.amount

    tx_id = str(uuid.uuid4())
    ref_id = idempotency_key or str(uuid.uuid4())

    debit_tx = Transaction(
        id=tx_id,
        account_id=source.id,
        type="transfer_out",
        amount=payload.amount,
        description=f"External ACH transfer to {payee.name} (...{payee.account_number[-4:]})",
        category="transfers",
        payee_id=payee.id,
        status="completed",
        reference_id=ref_id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(debit_tx)

    # Evaluate risk
    evaluate_transaction_risk(
        db, current_user.id, payload.amount, payee.account_number, ip_address
    )

    log_audit_event(
        db,
        "EXTERNAL_TRANSFER",
        current_user.username,
        f"transfers/external/{tx_id}",
        ip_address,
        "SUCCESS",
        {"amount": float(payload.amount)},
    )
    db.commit()

    return ExternalTransferResponse(
        id=tx_id,
        amount=payload.amount,
        status="completed",
        created_at=debit_tx.created_at,
    )


@router.get("/api/v1/payees", response_model=List[PayeeResponse])
def list_payees(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    payees = db.query(Payee).filter(Payee.user_id == current_user.id).all()
    return payees


@router.post("/api/v1/payees", response_model=PayeeResponse, status_code=201)
def add_payee(
    request: Request,
    payload: PayeeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ip_address = request.client.host if request.client else "127.0.0.1"

    # Step-up authentication is required for adding a payee
    if not payload.step_up_session_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Step-up authentication required to add a payee.",
        )
    session_data = step_up_sessions.get(payload.step_up_session_id)
    if (
        not session_data
        or not session_data.get("verified")
        or session_data.get("user_id") != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or unverified step-up session.",
        )

    payee_id = str(uuid.uuid4())
    verification_code = "123456"  # Mock verification code

    new_payee = Payee(
        id=payee_id,
        user_id=current_user.id,
        name=payload.name,
        account_number=payload.account_number,
        routing_number=payload.routing_number,
        status="pending_verification",
        verification_code=verification_code,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_payee)

    log_audit_event(
        db,
        "PAYEE_ADDED",
        current_user.username,
        f"payees/{payee_id}",
        ip_address,
        "SUCCESS",
        {"name": payload.name},
    )
    db.commit()
    db.refresh(new_payee)

    return new_payee


@router.post("/api/v1/payees/{payee_id}/verify", response_model=PayeeResponse)
def verify_payee(
    payee_id: str,
    request: Request,
    payload: PayeeVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ip_address = request.client.host if request.client else "127.0.0.1"

    payee = (
        db.query(Payee)
        .filter(Payee.id == payee_id, Payee.user_id == current_user.id)
        .first()
    )
    if not payee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Payee not found"
        )

    if payee.verification_code != payload.verification_code:
        log_audit_event(
            db,
            "PAYEE_VERIFICATION_FAILED",
            current_user.username,
            f"payees/{payee_id}/verify",
            ip_address,
            "FAILED",
            {"reason": "Invalid verification code"},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code"
        )

    payee.status = "verified"
    payee.verification_code = None

    log_audit_event(
        db,
        "PAYEE_VERIFIED",
        current_user.username,
        f"payees/{payee_id}/verify",
        ip_address,
        "SUCCESS",
        {"name": payee.name},
    )
    db.commit()
    db.refresh(payee)

    return payee


@router.get("/api/v1/limits", response_model=LimitsResponse)
def get_limits(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Calculate daily remaining limit
    # Sum of external transfers today
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    today_transfers = (
        db.query(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .filter(
            Account.user_id == current_user.id,
            Transaction.type == "transfer_out",
            Transaction.created_at >= today_start,
        )
        .all()
    )

    total_today = sum(tx.amount for tx in today_transfers)
    daily_limit = Decimal("10000.00")
    daily_remaining = max(Decimal("0.00"), daily_limit - total_today)

    return LimitsResponse(
        daily_limit=daily_limit,
        daily_remaining=daily_remaining,
        per_transaction_limit=Decimal("5000.00"),
    )
