import pytest
from app.models.tenant import Tenant


def test_quota_check_middleware_allows_under_limit(client, auth_headers, sample_tenant, db):
    # Tenant has 10/100 processed -> should succeed with 202
    sample_tenant.invoices_processed = 10
    sample_tenant.monthly_credit_limit = 100
    db.commit()

    response = client.post(
        "/api/v1/parse-async",
        headers=auth_headers,
        data={"file_name": "Under_Limit.pdf"},
    )
    assert response.status_code == 202


def test_quota_check_middleware_aborts_with_402_when_exhausted(client, auth_headers, sample_tenant, db):
    # Set usage to equal monthly limit (100 / 100) -> must abort with 402
    sample_tenant.invoices_processed = 100
    sample_tenant.monthly_credit_limit = 100
    db.commit()

    response = client.post(
        "/api/v1/parse-async",
        headers=auth_headers,
        data={"file_name": "Quota_Exceeded.pdf"},
    )

    assert response.status_code == 402
    data = response.json()
    assert "Quota exceeded. Please upgrade your plan." in data["error"]
    assert data["invoices_processed"] == 100
    assert data["monthly_limit"] == 100
