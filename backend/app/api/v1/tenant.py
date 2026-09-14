from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from app.models.document import Document
from app.schemas.tenant import TenantQuotaResponse, TenantSettingsUpdate

router = APIRouter(prefix="/tenant", tags=["Tenant & Multi-Tenancy"])


@router.get("/quota", response_model=TenantQuotaResponse)
def get_tenant_quota(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    remaining = max(0, tenant.monthly_credit_limit - tenant.invoices_processed)
    return TenantQuotaResponse(
        tenant_id=tenant.id,
        name=tenant.name,
        plan=tenant.plan,
        invoices_processed=tenant.invoices_processed,
        monthly_credit_limit=tenant.monthly_credit_limit,
        remaining_credits=remaining,
        auto_delete_original_pdf=tenant.auto_delete_original_pdf,
        can_process=remaining > 0,
        api_key=tenant.api_key,
    )


@router.patch("/settings", response_model=TenantQuotaResponse)
def update_tenant_settings(
    settings_in: TenantSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if settings_in.name is not None:
        tenant.name = settings_in.name
    if settings_in.auto_delete_original_pdf is not None:
        tenant.auto_delete_original_pdf = settings_in.auto_delete_original_pdf

    db.commit()
    db.refresh(tenant)

    remaining = max(0, tenant.monthly_credit_limit - tenant.invoices_processed)
    return TenantQuotaResponse(
        tenant_id=tenant.id,
        name=tenant.name,
        plan=tenant.plan,
        invoices_processed=tenant.invoices_processed,
        monthly_credit_limit=tenant.monthly_credit_limit,
        remaining_credits=remaining,
        auto_delete_original_pdf=tenant.auto_delete_original_pdf,
        can_process=remaining > 0,
        api_key=tenant.api_key,
    )


@router.get("/documents", summary="List All Documents for Current Tenant (Isolated)")
def list_tenant_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Strict multi-tenancy isolation: filters exclusively by current_user.tenant_id
    docs = (
        db.query(Document)
        .filter(Document.tenant_id == current_user.tenant_id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return docs
