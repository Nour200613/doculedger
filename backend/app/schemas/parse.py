from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field


class AsyncParseResponse(BaseModel):
    job_id: str
    status: str = "queued"
    file_name: str
    created_at: str
    message: str = "Job accepted for asynchronous processing"


class JobStatusResponse(BaseModel):
    job_id: str
    status: str  # "queued", "processing", "completed", "failed"
    progress: int = Field(ge=0, le=100)
    file_name: str
    created_at: str
    updated_at: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class PresignedUploadRequest(BaseModel):
    file_name: str
    file_size: int
    content_type: str = "application/pdf"


class PresignedUploadResponse(BaseModel):
    file_id: str
    upload_url: str
    file_path: str
    expires_in_seconds: int = 900
    headers: Dict[str, str] = {}
