from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.parse import router as parse_router
from app.api.v1.storage import router as storage_router
from app.api.v1.tenant import router as tenant_router
from app.api.v1.payments import router as payments_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(parse_router)
api_router.include_router(storage_router)
api_router.include_router(tenant_router)
api_router.include_router(payments_router, prefix="/payments", tags=["Payments"])
