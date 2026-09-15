from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.database import init_db
from app.middleware.quota import QuotaCheckMiddleware
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    logger.info("Initializing database schema...")
    try:
        init_db()
        logger.info("Database schema verified")
    except Exception as e:
        logger.warning("Database initialization deferred or failed", error=str(e))
    logger.info("DocuLedger backend successfully initialized", app_name=settings.APP_NAME)
    yield
    # Shutdown
    logger.info("Shutting down DocuLedger backend...")


app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# 1. Custom Quota Check Middleware (HTTP 402 Abort)
app.add_middleware(QuotaCheckMiddleware)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "docs": f"{settings.API_V1_STR}/docs",
        "health": "/health",
    }


@app.get("/docs", include_in_schema=False)
def redirect_to_docs():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"{settings.API_V1_STR}/docs")


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
