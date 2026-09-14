import asyncio
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.document import ParsingJob
from app.schemas.parse import AsyncParseResponse, JobStatusResponse
from app.services.quota_service import QuotaService
from app.tasks.parse_tasks import parse_pdf_async_task, execute_parsing_logic, _active_jobs_memory
from app.core.logging import logger
from app.core.config import settings

router = APIRouter(tags=["Document Parsing"])


@router.post(
    "/parse-async",
    response_model=AsyncParseResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit PDF for Asynchronous Parsing (<100ms Response)",
)
def parse_async(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(None),
    file_name: str = Form(None),
    storage_path: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits a PDF for asynchronous extraction.
    Returns 202 Accepted immediately within <100ms with job_id.
    """
    resolved_file_name = file_name or (file.filename if file else "uploaded_invoice.pdf")

    # 1. Create Job record in database
    job = ParsingJob(
        tenant_id=current_user.tenant_id,
        file_name=resolved_file_name,
        status="queued",
        progress=0,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # 2. Increment tenant usage counter
    QuotaService.increment_usage(current_user.tenant_id, db)

    # 3. Dispatch processing via Celery in production or BackgroundTasks in dev/test
    dispatched = False
    if settings.ENVIRONMENT == "production":
        try:
            parse_pdf_async_task.delay(
                job_id=job.id,
                tenant_id=current_user.tenant_id,
                file_name=resolved_file_name,
                storage_path=storage_path,
            )
            dispatched = True
        except Exception as e:
            logger.info("Celery broker offline, running via FastAPI BackgroundTasks", error=str(e))

    if not dispatched:
        background_tasks.add_task(
            execute_parsing_logic,
            job_id=job.id,
            tenant_id=current_user.tenant_id,
            file_name=resolved_file_name,
            storage_path=storage_path,
        )

    # 4. Immediate response <100ms
    return AsyncParseResponse(
        job_id=job.id,
        status="queued",
        file_name=resolved_file_name,
        created_at=datetime.now(timezone.utc).isoformat(),
        message="Job accepted for asynchronous processing",
    )


@router.get(
    "/jobs/{job_id}",
    response_model=JobStatusResponse,
    summary="Poll Status of a Parsing Job",
)
def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Poll current status and result of a background parsing job."""
    job = db.query(ParsingJob).filter(
        ParsingJob.id == job_id,
        ParsingJob.tenant_id == current_user.tenant_id,  # Strict tenant isolation
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    parsed_result = json.loads(job.result_data) if job.result_data else None

    return JobStatusResponse(
        job_id=job.id,
        status=job.status,
        progress=job.progress,
        file_name=job.file_name,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat(),
        result=parsed_result,
        error=job.error_message,
    )


@router.get(
    "/jobs/{job_id}/stream",
    summary="Server-Sent Events (SSE) Stream for Live Job Progress",
)
async def stream_job_events(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Streams live real-time Server-Sent Events (SSE) as the job progresses."""
    job = db.query(ParsingJob).filter(
        ParsingJob.id == job_id,
        ParsingJob.tenant_id == current_user.tenant_id,
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        for _ in range(30):  # Stream for up to 30 seconds
            active = _active_jobs_memory.get(job_id)
            if active:
                data = {
                    "job_id": job_id,
                    "status": active.get("status"),
                    "progress": active.get("progress", 0),
                    "result": active.get("result"),
                }
                yield f"data: {json.dumps(data)}\n\n"
                if active.get("status") in ("completed", "failed"):
                    break
            else:
                yield f"data: {json.dumps({'job_id': job_id, 'status': job.status, 'progress': job.progress})}\n\n"
                if job.status in ("completed", "failed"):
                    break
            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
