import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.security import decode_token
from app.core.database import SessionLocal
from app.services.quota_service import QuotaService
from app.core.logging import logger


class QuotaCheckMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # We only enforce quota checks on parsing endpoints
        if request.method == "POST" and request.url.path.endswith("/parse-async"):
            # Extract tenant from Authorization Bearer token or X-Tenant-ID header
            tenant_id = None
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.replace("Bearer ", "").strip()
                payload = decode_token(token)
                if payload:
                    tenant_id = payload.get("tenant_id")

            # Fallback to custom header for testing / API key access
            if not tenant_id:
                tenant_id = request.headers.get("X-Tenant-ID")

            if tenant_id:
                db = SessionLocal()
                try:
                    used, limit, can_process = QuotaService.get_tenant_usage(tenant_id, db)
                    if not can_process:
                        logger.warning(
                            "Quota exceeded for tenant",
                            tenant_id=tenant_id,
                            used=used,
                            limit=limit,
                        )
                        return Response(
                            content=json.dumps(
                                {
                                    "error": "Quota exceeded. Please upgrade your plan.",
                                    "invoices_processed": used,
                                    "monthly_limit": limit,
                                }
                            ),
                            status_code=402,
                            media_type="application/json",
                        )
                finally:
                    db.close()

        response = await call_next(request)
        return response
