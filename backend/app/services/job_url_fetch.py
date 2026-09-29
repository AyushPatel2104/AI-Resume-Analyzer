from typing import Callable

import httpx

from app.config import Settings
from app.services.job_url_security import JobUrlSecurityError, validate_public_http_url

_ALLOWED_CONTENT_TYPES = (
    "text/html",
    "application/xhtml+xml",
    "text/plain",
)


class JobUrlFetchError(Exception):
    pass


def _validate_content_type(content_type: str | None) -> None:
    if not content_type:
        raise JobUrlFetchError("Response missing content type.")
    lowered = content_type.split(";")[0].strip().lower()
    if not any(lowered.startswith(allowed) for allowed in _ALLOWED_CONTENT_TYPES):
        raise JobUrlFetchError("Unsupported content type for job URL import.")


async def fetch_public_job_html(
    url: str,
    settings: Settings,
    *,
    client_factory: Callable[[], httpx.AsyncClient] | None = None,
) -> tuple[str, str]:
    """Fetch HTML from a public URL with SSRF protections. Returns (final_url, html)."""
    current_url = validate_public_http_url(url)
    max_redirects = settings.job_url_max_redirects
    timeout = httpx.Timeout(settings.job_url_timeout_seconds)

    async def _get(target: str, client: httpx.AsyncClient) -> httpx.Response:
        return await client.get(
            target,
            headers={"User-Agent": "AI-Resume-Analyzer-JobImport/1.0", "Accept": "text/html,text/plain"},
        )

    factory = client_factory or (lambda: httpx.AsyncClient(timeout=timeout, follow_redirects=False))
    async with factory() as client:
        response = await _get(current_url, client)
        redirects = 0
        while response.status_code in {301, 302, 303, 307, 308}:
            if redirects >= max_redirects:
                raise JobUrlFetchError("Too many redirects.")
            location = response.headers.get("location")
            if not location:
                raise JobUrlFetchError("Redirect missing location header.")
            next_url = httpx.URL(current_url).join(location)
            try:
                current_url = validate_public_http_url(str(next_url))
            except JobUrlSecurityError as exc:
                raise security_error_as_fetch(exc) from exc
            response = await _get(current_url, client)
            redirects += 1

        if response.status_code >= 400:
            raise JobUrlFetchError(f"Unable to fetch job page (HTTP {response.status_code}).")

        _validate_content_type(response.headers.get("content-type"))

        content = response.content
        if len(content) > settings.job_url_max_response_bytes:
            raise JobUrlFetchError("Job page response is too large.")

        html = content.decode(response.encoding or "utf-8", errors="replace")
        if len(html.strip()) < 80:
            raise JobUrlFetchError("Job page did not contain enough readable content.")

        return current_url, html


def security_error_as_fetch(exc: JobUrlSecurityError) -> JobUrlFetchError:
    return JobUrlFetchError(str(exc))
