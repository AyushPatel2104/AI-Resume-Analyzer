from typing import Any, Callable

import httpx

from app.config import Settings
from app.services.job_html_extract import extract_job_from_html
from app.services.job_library import JobValidationError, validate_manual_job_fields
from app.services.job_normalization import normalize_job_requirements, normalize_whitespace
from app.services.job_url_fetch import JobUrlFetchError, fetch_public_job_html, security_error_as_fetch
from app.services.job_url_security import JobUrlSecurityError


async def preview_job_import_from_url(
    url: str,
    settings: Settings,
    *,
    client_factory: Callable[[], httpx.AsyncClient] | None = None,
) -> dict[str, Any]:
    try:
        final_url, html = await fetch_public_job_html(url, settings, client_factory=client_factory)
    except JobUrlSecurityError as exc:
        raise security_error_as_fetch(exc) from exc

    extracted = extract_job_from_html(html, final_url)
    description = extracted.get("job_description")
    if not description or len(str(description)) < 30:
        raise JobUrlFetchError("Could not extract a usable job description from this page.")

    title = extracted.get("title") or "Imported job"
    company = extracted.get("company_name")

    try:
        title, company, description = validate_manual_job_fields(
            title=str(title),
            company_name=str(company) if company else None,
            job_description=str(description),
            settings=settings,
        )
    except JobValidationError as exc:
        raise JobUrlFetchError(str(exc)) from exc

    normalized = normalize_job_requirements(description)
    return {
        "title": title,
        "company_name": company,
        "job_description": description,
        "source_url": final_url,
        "normalized_requirements": normalized,
    }
