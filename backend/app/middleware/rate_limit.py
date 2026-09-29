import logging
import time
from collections import defaultdict, deque
from threading import Lock

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

_BUCKETS: dict[str, deque[float]] = defaultdict(deque)
_LOCK = Lock()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _route_bucket(path: str, method: str) -> str | None:
    if method != "POST":
        return None
    if path.endswith("/auth/login") or path.endswith("/auth/register"):
        return "auth"
    if path.endswith("/resumes"):
        return "upload"
    if path.endswith("/analyze"):
        return "analyze"
    if path.endswith("/jobs/import/preview"):
        return "job_import"
    if "/career-assistant/" in path:
        return "career_assistant"
    return None


class InMemoryRateLimiter:
    """Single-process limiter — not distributed across multiple instances."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def _limit_for(self, bucket: str) -> int:
        return {
            "auth": self._settings.rate_limit_auth_per_minute,
            "upload": self._settings.rate_limit_upload_per_minute,
            "analyze": self._settings.rate_limit_analyze_per_minute,
            "job_import": self._settings.rate_limit_job_import_per_minute,
            "career_assistant": self._settings.rate_limit_career_assistant_per_minute,
        }.get(bucket, 60)

    def allow(self, key: str, bucket: str) -> bool:
        if not self._settings.rate_limit_enabled:
            return True
        limit = self._limit_for(bucket)
        now = time.monotonic()
        window = 60.0
        composite = f"{bucket}:{key}"
        with _LOCK:
            hits = _BUCKETS[composite]
            while hits and now - hits[0] > window:
                hits.popleft()
            if len(hits) >= limit:
                return False
            hits.append(now)
        return True


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        bucket = _route_bucket(request.url.path, request.method)
        if bucket:
            limiter = InMemoryRateLimiter(settings)
            ip = _client_ip(request)
            if not limiter.allow(ip, bucket):
                logger.warning("rate_limit_exceeded bucket=%s ip=%s path=%s", bucket, ip, request.url.path)
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."},
                )
        return await call_next(request)
