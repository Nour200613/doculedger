from typing import Tuple
from sqlalchemy.orm import Session
from app.models.tenant import Tenant
from app.core.config import settings
from app.core.security import get_redis


class QuotaService:
    @staticmethod
    def get_tenant_usage(tenant_id: str, db: Session) -> Tuple[int, int, bool]:
        """
        Returns (invoices_processed, monthly_limit, can_process).
        Checks Redis cache first, then falls back to database.
        """
        r = get_redis()
        if r is not None:
            try:
                cached = r.get(f"quota:{tenant_id}:used")
                if cached is not None:
                    used = int(cached)
                    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
                    limit = tenant.monthly_credit_limit if tenant else settings.DEFAULT_MONTHLY_LIMIT
                    return used, limit, used < limit
            except Exception:
                pass

        # Database lookup
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            return 0, settings.DEFAULT_MONTHLY_LIMIT, True

        used = tenant.invoices_processed
        limit = tenant.monthly_credit_limit
        return used, limit, used < limit

    @staticmethod
    def increment_usage(tenant_id: str, db: Session) -> int:
        """Increment tenant invoice counter after job creation."""
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if tenant:
            tenant.invoices_processed += 1
            db.commit()
            used = tenant.invoices_processed

            r = get_redis()
            if r is not None:
                try:
                    r.set(f"quota:{tenant_id}:used", used)
                except Exception:
                    pass
            return used
        return 0

    @staticmethod
    def reset_usage(tenant_id: str, db: Session) -> None:
        """Reset monthly invoice usage to 0 (called on subscription renewal)."""
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if tenant:
            tenant.invoices_processed = 0
            db.commit()
            r = get_redis()
            if r is not None:
                try:
                    r.set(f"quota:{tenant_id}:used", 0)
                except Exception:
                    pass
