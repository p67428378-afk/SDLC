from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./test.db"
    JWT_SECRET_KEY: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Security & Lockout Settings
    MFA_OTP_COOLDOWN_SECONDS: int = 60
    MFA_OTP_MAX_RESENDS: int = 5
    LOGIN_LOCKOUT_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 30
    LOGIN_RESTARTS_CAP: int = 3
    LOGIN_RESTARTS_WINDOW_MINUTES: int = 15
    IP_THROTTLE_THRESHOLD: int = 20
    IP_THROTTLE_WINDOW_MINUTES: int = 10

    # Banking Settings
    LARGE_TRANSFER_THRESHOLD: float = 5000.0

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
