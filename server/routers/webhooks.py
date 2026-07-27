import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from server.database import get_db
from server.models.webhook import WebhookSubscription
from server.models.user import User
from server.schemas.webhook import WebhookRequest, WebhookResponse
from server.utils.security import get_current_user

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


@router.post("", response_model=WebhookResponse, status_code=201)
def subscribe_webhook(
    payload: WebhookRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub_id = str(uuid.uuid4())
    new_sub = WebhookSubscription(
        id=sub_id,
        user_id=current_user.id,
        url=payload.url,
        events=payload.events,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub


@router.get("", response_model=List[WebhookResponse])
def list_webhooks(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    subs = (
        db.query(WebhookSubscription)
        .filter(WebhookSubscription.user_id == current_user.id)
        .all()
    )
    return subs


@router.delete("/{webhook_id}")
def unsubscribe_webhook(
    webhook_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = (
        db.query(WebhookSubscription)
        .filter(
            WebhookSubscription.id == webhook_id,
            WebhookSubscription.user_id == current_user.id,
        )
        .first()
    )
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found"
        )

    db.delete(sub)
    db.commit()
    return {"message": "Webhook subscription successfully removed"}
