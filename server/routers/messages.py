import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from server.database import get_db
from server.models.message import Message
from server.models.user import User
from server.schemas.message import MessageRequest, MessageResponse, MessageUpdate
from server.utils.security import get_current_user

router = APIRouter(prefix="/api/v1/messages", tags=["messages"])


@router.get("", response_model=List[MessageResponse])
def list_messages(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    messages = (
        db.query(Message)
        .filter(Message.user_id == current_user.id)
        .order_by(Message.created_at.desc())
        .all()
    )
    return messages


@router.get("/{message_id}", response_model=MessageResponse)
def get_message(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = (
        db.query(Message)
        .filter(Message.id == message_id, Message.user_id == current_user.id)
        .first()
    )
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Message not found"
        )
    return message


@router.post("", response_model=MessageResponse, status_code=201)
def send_message(
    payload: MessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message_id = str(uuid.uuid4())
    new_message = Message(
        id=message_id,
        user_id=current_user.id,
        subject=payload.subject,
        body=payload.body,
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message


@router.put("/{message_id}", response_model=MessageResponse)
def update_message(
    message_id: str,
    payload: MessageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = (
        db.query(Message)
        .filter(Message.id == message_id, Message.user_id == current_user.id)
        .first()
    )
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Message not found"
        )

    message.is_read = payload.is_read
    db.commit()
    db.refresh(message)
    return message
