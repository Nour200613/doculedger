from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    APP_NAME: str = "DocuLedger B2B Parser API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "docu-ledger-super-secret-key-change-in-production-9812480129"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./doculedger.db"
    SYNC_DATABASE_URL: str = "sqlite:///./doculedger.db"

    # Redis & Queue
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # Cloud Storage & Privacy
    STORAGE_URL_TTL_SECONDS: int = 900  # 15 minutes TTL for presigned URLs
    DEFAULT_MONTHLY_LIMIT: int = 100

    # Stripe Payments & Billing
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_51DocuLedgerTestKey001928"
    STRIPE_SECRET_KEY: str = "sk_test_51DocuLedgerTestKeySecret001928"
    STRIPE_WEBHOOK_SECRET: str = "whsec_testDocuLedgerWebhookSecret001928"
    STRIPE_PRICE_STARTER_MONTHLY: str = "price_starter_monthly_29"
    STRIPE_PRICE_ENTERPRISE_MONTHLY: str = "price_enterprise_monthly_99"
    FRONTEND_URL: str = "http://localhost:3000"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://doculedger.vercel.app",
    ]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="allow")


settings = Settings()
