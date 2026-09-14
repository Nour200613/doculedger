from fastapi import APIRouter, Depends, HTTPException, status
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.schemas.parse import PresignedUploadRequest, PresignedUploadResponse
from app.services.storage_service import StorageService

router = APIRouter(prefix="/storage", tags=["Cloud Storage & Privacy"])


@router.post(
    "/presigned-upload",
    response_model=PresignedUploadResponse,
    summary="Generate Temporary Presigned Upload URL (15-min TTL)",
)
def get_presigned_upload_url(
    req: PresignedUploadRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generates a secure temporary presigned upload URL with a 15-minute TTL.
    Ensures direct client-to-storage streaming without burdening the API server.
    """
    result = StorageService.generate_presigned_upload_url(
        tenant_id=current_user.tenant_id,
        file_name=req.file_name,
        content_type=req.content_type,
    )
    return PresignedUploadResponse(**result)


@router.delete(
    "/files/{file_path:path}",
    summary="Purge Original Raw PDF from Cloud Storage",
)
def delete_stored_file(
    file_path: str,
    current_user: User = Depends(get_current_user),
):
    """
    Manually or programmatically triggers deletion of raw PDF for strict compliance.
    """
    StorageService.delete_raw_pdf(tenant_id=current_user.tenant_id, storage_path=file_path)
    return {"message": "File purged from storage successfully", "path": file_path}
