from typing import Optional
from pydantic import BaseModel


class TenantSettingsUpdate(BaseModel):
    name: Optional[str] = None
    auto_delete_original_pdf: Optional[bool] = None


class TenantQuotaResponse(BaseModel):
    tenant_id: str
    name: str
    plan: str
    invoices_processed: int
    monthly_credit_limit: int
    remaining_credits: int
    auto_delete_original_pdf: bool
    can_process: bool
    api_key: str

    model_config = {"from_attributes": True}
