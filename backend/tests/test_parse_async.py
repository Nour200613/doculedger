import time
from unittest.mock import patch
import pytest


def test_parse_async_fast_acknowledgement(client, auth_headers):
    """
    Requirements verification:
    'POST /api/v1/parse-async must return 202 Accepted with a job_id within <100ms.'
    """
    start_time = time.perf_counter()
    with patch("fastapi.BackgroundTasks.add_task"):
        response = client.post(
            "/api/v1/parse-async",
            headers=auth_headers,
            data={
                "file_name": "Invoice_Aug_2026.pdf",
                "storage_path": "tenants/t1/uploads/Invoice_Aug_2026.pdf",
            },
        )
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    assert response.status_code == 202
    assert elapsed_ms < 100, f"Expected response in <100ms, took {elapsed_ms:.2f}ms"

    data = response.json()
    assert "job_id" in data
    assert data["status"] == "queued"
    assert data["file_name"] == "Invoice_Aug_2026.pdf"


def test_poll_job_status(client, auth_headers):
    # Submit job
    submit_resp = client.post(
        "/api/v1/parse-async",
        headers=auth_headers,
        data={"file_name": "Poll_Test.pdf"},
    )
    assert submit_resp.status_code == 202
    job_id = submit_resp.json()["job_id"]

    # Poll status
    status_resp = client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["job_id"] == job_id
    assert status_data["status"] in ("queued", "processing", "completed")
    assert "progress" in status_data


def test_stream_job_sse_events(client, auth_headers):
    submit_resp = client.post(
        "/api/v1/parse-async",
        headers=auth_headers,
        data={"file_name": "Stream_Test.pdf"},
    )
    job_id = submit_resp.json()["job_id"]

    # Stream SSE
    stream_resp = client.get(f"/api/v1/jobs/{job_id}/stream", headers=auth_headers)
    assert stream_resp.status_code == 200
    assert "text/event-stream" in stream_resp.headers["content-type"]
    assert "data:" in stream_resp.text
