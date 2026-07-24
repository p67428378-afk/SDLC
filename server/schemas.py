from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Any
from datetime import datetime


# Auth Schemas
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    username: str
    password: str


class UserMinResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    full_name: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserMinResponse


# Account Schemas
class AccountResponse(BaseModel):
    id: str
    account_number: str
    account_type: str
    balance: float
    currency: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StatementResponse(BaseModel):
    id: str
    file_name: str
    download_url: str
    statement_date: str

    model_config = ConfigDict(from_attributes=True)


# Profile & Preferences Schemas
class ProfileUpdate(BaseModel):
    email: EmailStr
    full_name: str


class PreferencesUpdate(BaseModel):
    email_alerts: bool
    min_alert_amount: float
    sms_alerts: bool


class PreferencesResponse(BaseModel):
    email_alerts: bool
    min_alert_amount: float
    sms_alerts: bool

    model_config = ConfigDict(from_attributes=True)


# Transaction Schemas
class TransactionResponse(BaseModel):
    id: str
    source_account_id: str
    destination_account_id: Optional[str] = None
    amount: float
    type: str
    description: Optional[str] = None
    status: str
    transaction_date: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionHistoryResponse(BaseModel):
    items: List[TransactionResponse]
    page: int
    total: int


class TransferRequest(BaseModel):
    amount: float = Field(gt=0)
    description: str
    destination_account_number: str
    source_account_id: str


class TransferResponse(BaseModel):
    id: str
    source_account_id: str
    destination_account_id: str
    amount: float
    type: str
    description: Optional[str] = None
    status: str
    transaction_date: datetime

    model_config = ConfigDict(from_attributes=True)


# Admin & Audit Schemas
class AuditLogResponse(BaseModel):
    id: str
    user_id: str
    event_type: str
    event_details: Any
    source_ip: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditTrailResponse(BaseModel):
    items: List[AuditLogResponse]
    page: int
    total: int


class TransactionMinResponse(BaseModel):
    id: str
    source_account_id: str
    destination_account_id: Optional[str] = None
    amount: float

    model_config = ConfigDict(from_attributes=True)


class FraudAlertResponse(BaseModel):
    id: str
    transaction_id: str
    rule_triggered: str
    risk_score: int
    status: str
    created_at: datetime
    transaction: TransactionMinResponse

    model_config = ConfigDict(from_attributes=True)


class FraudAlertsResponse(BaseModel):
    items: List[FraudAlertResponse]
    page: int
    total: int


class SuspendRequest(BaseModel):
    reason: str


class SuspendResponse(BaseModel):
    id: str
    status: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
