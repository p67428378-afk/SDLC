from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from server.database import get_db
from server.models.session import Session as UserSession
from server.schemas.session import SessionResponse
from server.utils.security import get_current_user
from server.models.user import User
from server.utils.audit import log_audit_event

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


@router.get("", response_model=List[SessionResponse])
def list_sessions(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(UserSession)
        .filter(UserSession.user_id == current_user.id, UserSession.is_active == True)
        .all()
    )

    # Get current session token from Authorization header
    auth_header = request.headers.get("Authorization")
    current_token = (
        auth_header.split(" ")[1]
        if auth_header and auth_header.startswith("Bearer ")
        else None
    )

    response = []
    for s in sessions:
        is_current = (s.refresh_token == current_token) or (
            current_token is not None and s.refresh_token in current_token
        )
        # Let's make sure we set is_current correctly
        response.append(
            SessionResponse(
                id=s.id,
                channel=s.channel,
                device_info=s.device_info,
                ip_address=s.ip_address,
                location=s.location,
                is_current=is_current,
                last_active_at=s.last_active_at,
            )
        )
    return response


@router.post("/{session_id}/revoke")
def revoke_session(
    session_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(UserSession)
        .filter(UserSession.id == session_id, UserSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    session.is_active = False

    ip_address = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db,
        "SESSION_REVOKED",
        current_user.username,
        f"sessions/{session_id}/revoke",
        ip_address,
        "SUCCESS",
        {"revoked_session_id": session_id},
    )
    db.commit()

    return {"message": "Session successfully revoked"}
