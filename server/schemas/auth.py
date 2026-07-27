from pydantic import BaseModel
from typing import List, Optional


class LoginRequest(BaseModel):
    username: str
    password: str
    channel: str = "web"
    device_fingerprint: str = "unknown"


class LoginResponse(BaseModel):
    message: str
    mfa_methods: List[str]
    mfa_session_id: str


class MfaVerifyRequest(BaseModel):
    mfa_session_id: str
    method: str
    code: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    phone_number: Optional[str] = None
    role: str


class MfaVerifyResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class MfaResendRequest(BaseModel):
    mfa_session_id: str
    method: str


class MfaResendResponse(BaseModel):
    cooldown_seconds: int
    message: str
    remaining_attempts: int


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class StepUpRequest(BaseModel):
    action_type: str
    amount: Optional[float] = None
    code: Optional[str] = None


class StepUpResponse(BaseModel):
    message: str
    step_up_required: bool
    step_up_session_id: Optional[str] = None
