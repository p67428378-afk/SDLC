import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from server.database import get_db
from server.models.alert import Alert, AlertPreference
from server.models.user import User
from server.schemas.alert import (
    AlertResponse,
    AlertPreferenceResponse,
    AlertPreferenceRequest,
)
from server.utils.security import get_current_user

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


@router.get("", response_model=List[AlertResponse])
def list_alerts(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    alerts = (
        db.query(Alert)
        .filter(Alert.user_id == current_user.id)
        .order_by(Alert.created_at.desc())
        .all()
    )
    return alerts


@router.get("/preferences", response_model=AlertPreferenceResponse)
def get_preferences(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    pref = (
        db.query(AlertPreference)
        .filter(AlertPreference.user_id == current_user.id)
        .first()
    )
    if not pref:
        # Create default preferences
        pref = AlertPreference(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            low_balance_threshold=100.00,
            large_transaction_threshold=5000.00,
            channels={"email": True, "sms": True, "push": True},
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.post("/preferences", response_model=AlertPreferenceResponse)
def update_preferences(
    payload: AlertPreferenceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pref = (
        db.query(AlertPreference)
        .filter(AlertPreference.user_id == current_user.id)
        .first()
    )
    if not pref:
        pref = AlertPreference(id=str(uuid.uuid4()), user_id=current_user.id)
        db.add(pref)

    pref.low_balance_threshold = payload.low_balance_threshold
    pref.large_transaction_threshold = payload.large_transaction_threshold
    pref.channels = payload.channels

    db.commit()
    db.refresh(pref)
    return pref
