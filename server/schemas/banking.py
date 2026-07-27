from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


class AccountResponse(BaseModel):
    id: str
    account_number: str
    account_type: str
    balance: Decimal
    available_balance: Decimal
    currency: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: str
    amount: Decimal
    category: str
    date: datetime = Field(alias="created_at")
    description: str
    status: str
    type: str

    class Config:
        from_attributes = True
        populate_by_name = True


class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    limit: int
    skip: int
    total: int


class InternalTransferRequest(BaseModel):
    source_account_id: str
    destination_account_id: str
    amount: Decimal
    memo: Optional[str] = None


class InternalTransferResponse(BaseModel):
    id: str
    amount: Decimal
    status: str
    created_at: datetime


class ExternalTransferRequest(BaseModel):
    source_account_id: str
    destination_payee_id: str
    amount: Decimal
    memo: Optional[str] = None
    step_up_session_id: Optional[str] = None


class ExternalTransferResponse(BaseModel):
    id: str
    amount: Decimal
    status: str
    created_at: datetime


class PayeeRequest(BaseModel):
    name: str
    account_number: str
    routing_number: Optional[str] = None
    step_up_session_id: Optional[str] = None


class PayeeResponse(BaseModel):
    id: str
    name: str
    account_number: str
    routing_number: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class PayeeVerifyRequest(BaseModel):
    verification_code: str


class LimitsResponse(BaseModel):
    daily_limit: Decimal
    daily_remaining: Decimal
    per_transaction_limit: Decimal


class ConfigItemRequest(BaseModel):
    key: str
    value: str
    description: Optional[str] = None


class ConfigItemResponse(BaseModel):
    id: str
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
