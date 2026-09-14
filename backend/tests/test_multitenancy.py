import pytest
from app.models.tenant import Tenant
from app.models.user import User
from app.models.document import Document
from app.core.security import get_password_hash, create_access_token


def test_tenant_isolation_documents(client, db, sample_tenant, auth_headers):
    # 1. Create a second Tenant and second User
    tenant_b = Tenant(
        name="Competitor Finance LLC",
        plan="b2b",
        monthly_credit_limit=1000,
        invoices_processed=0,
    )
    db.add(tenant_b)
    db.commit()
    db.refresh(tenant_b)

    user_b = User(
        tenant_id=tenant_b.id,
        email="cfo@competitor.com",
        hashed_password=get_password_hash("pass123!"),
        full_name="Bob Competitor",
        role="owner",
    )
    db.add(user_b)
    db.commit()
    db.refresh(user_b)

    token_b = create_access_token(subject=user_b.id, tenant_id=tenant_b.id)
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 2. Add confidential document for Tenant A
    doc_a = Document(
        tenant_id=sample_tenant.id,
        file_name="Tenant_A_Secret_Payroll.pdf",
        vendor_name="Payroll Corp",
        total_amount=50000.0,
    )
    db.add(doc_a)
    db.commit()

    # 3. Request documents with Tenant A auth headers -> doc_a is visible
    resp_a = client.get("/api/v1/tenant/documents", headers=auth_headers)
    assert resp_a.status_code == 200
    file_names_a = [d["file_name"] for d in resp_a.json()]
    assert "Tenant_A_Secret_Payroll.pdf" in file_names_a

    # 4. Request documents with Tenant B auth headers -> doc_a MUST NOT be visible!
    resp_b = client.get("/api/v1/tenant/documents", headers=headers_b)
    assert resp_b.status_code == 200
    file_names_b = [d["file_name"] for d in resp_b.json()]
    assert "Tenant_A_Secret_Payroll.pdf" not in file_names_b
