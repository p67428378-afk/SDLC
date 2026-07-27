from sqlalchemy.orm import Session
from server.models.banking import Transaction


def check_idempotency_key(db: Session, reference_id: str) -> bool:
    """
    Returns True if the reference_id (idempotency key) has already been used.
    """
    if not reference_id:
        return False
    existing = (
        db.query(Transaction).filter(Transaction.reference_id == reference_id).first()
    )
    return existing is not None
