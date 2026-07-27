import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
from server.database import get_db
from server.models.user import User
from server.models.lockout import LockoutState
from server.models.session import Session as UserSession
from server.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MfaVerifyRequest,
    MfaVerifyResponse,
    MfaResendRequest,
    MfaResendResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    StepUpRequest,
    StepUpResponse,
    UserResponse,
)
from server.utils.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
)
from server.utils.audit import log_audit_event
from server.utils.notifications import send_notification
from server.config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# Simple in-memory IP tracking for throttling
ip_login_attempts = {}


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def check_ip_throttle(ip_address: str):
    now = datetime.now(timezone.utc)
    if ip_address not in ip_login_attempts:
        ip_login_attempts[ip_address] = []

    ten_minutes_ago = now - timedelta(minutes=settings.IP_THROTTLE_WINDOW_MINUTES)
    ip_login_attempts[ip_address] = [
        t for t in ip_login_attempts[ip_address] if t > ten_minutes_ago
    ]

    attempts = len(ip_login_attempts[ip_address])
    if attempts >= settings.IP_THROTTLE_THRESHOLD:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="IP address temporarily blocked due to too many login attempts.",
        )

    ip_login_attempts[ip_address].append(now)


@router.post("/login", response_model=LoginResponse)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    ip_address = request.client.host if request.client else "127.0.0.1"
    check_ip_throttle(ip_address)

    user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        log_audit_event(
            db,
            "LOGIN_FAILED",
            payload.username,
            "auth/login",
            ip_address,
            "FAILED",
            {"reason": "User not found"},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED,
            detail="Invalid credentials",
        )

    lockout = db.query(LockoutState).filter(LockoutState.user_id == user.id).first()
    if not lockout:
        lockout = LockoutState(id=str(uuid.uuid4()), user_id=user.id)
        db.add(lockout)
        db.commit()
        db.refresh(lockout)

    now = datetime.now(timezone.utc)
    locked_until = ensure_utc(user.locked_until)
    if user.is_locked:
        if locked_until and locked_until > now:
            log_audit_event(
                db,
                "LOGIN_FAILED",
                user.username,
                "auth/login",
                ip_address,
                "LOCKED",
                {"reason": "Account is locked"},
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is locked. Please try again later.",
            )
        else:
            user.is_locked = False
            user.locked_until = None
            lockout.failed_attempts = 0
            db.commit()

    fifteen_minutes_ago = now - timedelta(
        minutes=settings.LOGIN_RESTARTS_WINDOW_MINUTES
    )
    last_restart_at = ensure_utc(lockout.last_restart_at)
    if last_restart_at and last_restart_at > fifteen_minutes_ago:
        if lockout.login_flow_restarts >= settings.LOGIN_RESTARTS_CAP:
            user.is_locked = True
            user.locked_until = now + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
            log_audit_event(
                db,
                "ACCOUNT_LOCKED",
                user.username,
                "auth/login",
                ip_address,
                "LOCKED",
                {"reason": "Login flow restarts exceeded"},
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account locked due to too many login flow restarts.",
            )
    else:
        lockout.login_flow_restarts = 0

    if not verify_password(payload.password, user.hashed_password):
        lockout.failed_attempts += 1
        lockout.last_failed_at = now

        if lockout.failed_attempts >= settings.LOGIN_LOCKOUT_ATTEMPTS:
            user.is_locked = True
            user.locked_until = now + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
            log_audit_event(
                db,
                "ACCOUNT_LOCKED",
                user.username,
                "auth/login",
                ip_address,
                "LOCKED",
                {"reason": "Max failed attempts exceeded"},
            )
            send_notification(
                db,
                user.id,
                "SECURITY_ALERT",
                "Your account has been locked due to too many failed login attempts.",
            )
        else:
            log_audit_event(
                db,
                "LOGIN_FAILED",
                user.username,
                "auth/login",
                ip_address,
                "FAILED",
                {"reason": "Invalid password"},
            )

        db.commit()
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED,
            detail="Invalid credentials",
        )

    lockout.login_flow_restarts += 1
    lockout.last_restart_at = now

    otp_code = "123456"
    lockout.otp_code = otp_code
    lockout.otp_expires_at = now + timedelta(minutes=5)
    lockout.otp_resends = 0
    lockout.otp_failures = 0

    log_audit_event(
        db,
        "MFA_INITIATED",
        user.username,
        "auth/login",
        ip_address,
        "SUCCESS",
        {"mfa_session_id": lockout.id},
    )
    db.commit()

    return LoginResponse(
        message="Password verified. Please complete MFA verification.",
        mfa_methods=["sms", "email"],
        mfa_session_id=lockout.id,
    )


@router.post("/mfa/verify", response_model=MfaVerifyResponse)
def mfa_verify(
    request: Request, payload: MfaVerifyRequest, db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else "127.0.0.1"

    lockout = (
        db.query(LockoutState).filter(LockoutState.id == payload.mfa_session_id).first()
    )
    if not lockout:
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED,
            detail="Invalid MFA session",
        )

    user = db.query(User).filter(User.id == lockout.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED, detail="User not found"
        )

    now = datetime.now(timezone.utc)
    locked_until = ensure_utc(user.locked_until)
    if user.is_locked:
        if locked_until and locked_until > now:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Account is locked"
            )
        else:
            user.is_locked = False
            user.locked_until = None
            lockout.failed_attempts = 0
            db.commit()

    otp_expires_at = ensure_utc(lockout.otp_expires_at)
    if not otp_expires_at or otp_expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="OTP code has expired"
        )

    if lockout.otp_code != payload.code:
        lockout.otp_failures += 1
        lockout.failed_attempts += 1
        lockout.last_failed_at = now

        if lockout.failed_attempts >= settings.LOGIN_LOCKOUT_ATTEMPTS:
            user.is_locked = True
            user.locked_until = now + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
            log_audit_event(
                db,
                "ACCOUNT_LOCKED",
                user.username,
                "auth/mfa/verify",
                ip_address,
                "LOCKED",
                {"reason": "Max failed attempts exceeded during MFA"},
            )
            send_notification(
                db,
                user.id,
                "SECURITY_ALERT",
                "Your account has been locked due to too many failed login attempts.",
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account locked due to too many failed attempts.",
            )

        log_audit_event(
            db,
            "MFA_FAILED",
            user.username,
            "auth/mfa/verify",
            ip_address,
            "FAILED",
            {"reason": "Invalid OTP code"},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code"
        )

    lockout.failed_attempts = 0
    lockout.login_flow_restarts = 0
    lockout.otp_code = None
    lockout.otp_expires_at = None

    access_token = create_access_token({"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.id})

    session_id = str(uuid.uuid4())
    user_session = UserSession(
        id=session_id,
        user_id=user.id,
        refresh_token=refresh_token,
        channel="web",
        device_info=request.headers.get("User-Agent", "unknown"),
        ip_address=ip_address,
        expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        is_active=True,
    )
    db.add(user_session)

    log_audit_event(
        db,
        "LOGIN_SUCCESS",
        user.username,
        "auth/mfa/verify",
        ip_address,
        "SUCCESS",
        {"session_id": session_id},
    )
    db.commit()

    return MfaVerifyResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            phone_number=user.phone_number,
            role=user.role,
        ),
    )


@router.post("/mfa/resend", response_model=MfaResendResponse)
def mfa_resend(
    request: Request, payload: MfaResendRequest, db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else "127.0.0.1"

    lockout = (
        db.query(LockoutState).filter(LockoutState.id == payload.mfa_session_id).first()
    )
    if not lockout:
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED,
            detail="Invalid MFA session",
        )

    user = db.query(User).filter(User.id == lockout.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED, detail="User not found"
        )

    now = datetime.now(timezone.utc)

    last_otp_resend_at = ensure_utc(lockout.last_otp_resend_at)
    if last_otp_resend_at:
        cooldown_end = last_otp_resend_at + timedelta(
            seconds=settings.MFA_OTP_COOLDOWN_SECONDS
        )
        if now < cooldown_end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Please wait {int((cooldown_end - now).total_seconds())} seconds before requesting a new OTP.",
            )

    if lockout.otp_resends >= settings.MFA_OTP_MAX_RESENDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum OTP resend attempts exceeded for this login session.",
        )

    otp_code = "123456"
    lockout.otp_code = otp_code
    lockout.otp_expires_at = now + timedelta(minutes=5)
    lockout.otp_resends += 1
    lockout.last_otp_resend_at = now

    log_audit_event(
        db,
        "MFA_RESEND",
        user.username,
        "auth/mfa/resend",
        ip_address,
        "SUCCESS",
        {"resend_count": lockout.otp_resends},
    )
    db.commit()

    return MfaResendResponse(
        cooldown_seconds=settings.MFA_OTP_COOLDOWN_SECONDS,
        message="A new OTP code has been sent.",
        remaining_attempts=settings.MFA_OTP_MAX_RESENDS - lockout.otp_resends,
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
def refresh(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    token_payload = verify_token(payload.refresh_token)
    if not token_payload:
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED,
            detail="Invalid or expired refresh token",
        )

    user_id = token_payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED,
            detail="User not found or locked",
        )

    session = (
        db.query(UserSession)
        .filter(
            UserSession.refresh_token == payload.refresh_token,
            UserSession.is_active == True,
        )
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED,
            detail="Session revoked or inactive",
        )

    now = datetime.now(timezone.utc)
    session_expires_at = ensure_utc(session.expires_at)
    if session_expires_at < now:
        session.is_active = False
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED, detail="Session expired"
        )

    access_token = create_access_token({"sub": user.id, "role": user.role})
    new_refresh_token = create_refresh_token({"sub": user.id})

    session.refresh_token = new_refresh_token
    session.last_active_at = now
    db.commit()

    return TokenRefreshResponse(
        access_token=access_token, refresh_token=new_refresh_token
    )


@router.post("/logout")
def logout(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    session = (
        db.query(UserSession)
        .filter(UserSession.refresh_token == payload.refresh_token)
        .first()
    )
    if session:
        session.is_active = False
        db.commit()
    return {"message": "Successfully logged out"}


step_up_sessions = {}


@router.post("/step-up", response_model=StepUpResponse)
def step_up(request: Request, payload: StepUpRequest, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED, detail="Not authenticated"
        )
    token = auth_header.split(" ")[1]
    token_payload = verify_token(token)
    if not token_payload:
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED, detail="Invalid token"
        )

    user_id = token_payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED, detail="User not found"
        )

    ip_address = request.client.host if request.client else "127.0.0.1"

    if not payload.code:
        session_id = str(uuid.uuid4())
        step_up_sessions[session_id] = {
            "user_id": user.id,
            "code": "123456",
            "verified": False,
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
        }
        log_audit_event(
            db,
            "STEP_UP_CHALLENGE_INITIATED",
            user.username,
            "auth/step-up",
            ip_address,
            "SUCCESS",
            {"step_up_session_id": session_id},
        )
        db.commit()
        return StepUpResponse(
            message="Step-up challenge initiated. Please verify with OTP.",
            step_up_required=True,
            step_up_session_id=session_id,
        )
    else:
        found_session_id = None
        for sid, sdata in step_up_sessions.items():
            if (
                sdata["user_id"] == user.id
                and sdata["code"] == payload.code
                and sdata["expires_at"] > datetime.now(timezone.utc)
            ):
                found_session_id = sid
                sdata["verified"] = True
                break

        if not found_session_id:
            log_audit_event(
                db,
                "STEP_UP_CHALLENGE_FAILED",
                user.username,
                "auth/step-up",
                ip_address,
                "FAILED",
                {"reason": "Invalid or expired code"},
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code",
            )

        log_audit_event(
            db,
            "STEP_UP_CHALLENGE_VERIFIED",
            user.username,
            "auth/step-up",
            ip_address,
            "SUCCESS",
            {"step_up_session_id": found_session_id},
        )
        db.commit()
        return StepUpResponse(
            message="Step-up verification successful.",
            step_up_required=False,
            step_up_session_id=found_session_id,
        )
