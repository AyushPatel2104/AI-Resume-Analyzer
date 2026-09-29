import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.routes import analyze, applications, auth, career_assistant, health, jobs, resumes
from app.config import get_settings
from app.database import get_db, init_db
from app.exception_handlers import register_exception_handlers
from app.logging_config import configure_logging
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_logging import RequestLoggingMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.schemas import HealthResponse

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    configure_logging(settings)
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    if settings.is_sqlite:
        Path("./data").mkdir(parents=True, exist_ok=True)
    if settings.storage_backend == "local" and not settings.debug:
        logger.warning(
            "STORAGE_BACKEND=local with DEBUG=false — uploaded files are not durable on ephemeral hosts. "
            "See docs/PRODUCTION.md."
        )
    try:
        init_db()
        logger.info("Database migrations applied.")
    except Exception:
        logger.exception("Database migration failed during startup.")
        raise
    logger.info("Application startup complete.")
    yield
    logger.info("Application shutdown.")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        lifespan=lifespan,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        openapi_url="/openapi.json" if settings.debug else None,
    )

    register_exception_handlers(app, settings)

    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def liveness() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/health/ready", response_model=HealthResponse)
    def readiness(db: Session = Depends(get_db)) -> HealthResponse:
        db_status = "ok"
        try:
            db.execute(text("SELECT 1"))
        except Exception:
            db_status = "error"
        return HealthResponse(
            status="ok" if db_status == "ok" else "degraded",
            app=settings.app_name,
            database=db_status,
        )

    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(auth.router, prefix=settings.api_prefix)
    app.include_router(analyze.router, prefix=settings.api_prefix)
    app.include_router(resumes.router, prefix=settings.api_prefix)
    app.include_router(jobs.router, prefix=settings.api_prefix)
    app.include_router(career_assistant.router, prefix=settings.api_prefix)
    app.include_router(applications.router, prefix=settings.api_prefix)

    @app.get("/")
    def root() -> dict[str, str]:
        payload = {"service": settings.app_name}
        if settings.debug:
            payload["docs"] = "/docs"
        return payload

    return app


app = create_app()
