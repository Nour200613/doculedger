import pytest
from app.core.security import is_token_blacklisted


def test_register_new_tenant_and_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "finance@hyperscale.io",
            "password": "strongPassword123!",
            "org_name": "HyperScale Financial Services",
            "full_name": "Alice Finance",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "owner"
    assert "refresh_token" in response.cookies


def test_login_success_and_cookie(client, sample_user):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": sample_user.email,
            "password": "securePassword123!",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user_id"] == sample_user.id
    assert "refresh_token" in response.cookies


def test_login_invalid_credentials(client, sample_user):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": sample_user.email,
            "password": "wrongPassword!",
        },
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_logout_blacklists_token(client, auth_headers):
    # Verify access to /me works with valid token
    me_resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_resp.status_code == 200

    # Call logout
    logout_resp = client.post("/api/v1/auth/logout", headers=auth_headers)
    assert logout_resp.status_code == 200
    assert "Token revoked" in logout_resp.json()["message"]

    # Try accessing /me again with the revoked token - must be rejected with 401!
    rejected_resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert rejected_resp.status_code == 401
    assert "Token has been revoked" in rejected_resp.json()["detail"]
