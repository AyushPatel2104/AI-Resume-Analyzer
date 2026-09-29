import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import Job, User
from app.services.job_normalization import normalize_whitespace, normalized_requirements_to_json


class JobValidationError(Exception):
    pass


def validate_manual_job_fields(
    *,
    title: str,
    company_name: str | None,
    job_description: str,
    settings: Settings,
) -> tuple[str, str | None, str]:
    clean_title = normalize_whitespace(title)
    clean_company = normalize_whitespace(company_name) if company_name else None
    clean_description = normalize_whitespace(job_description)

    if not clean_title or len(clean_title) > 512:
        raise JobValidationError("Title is required and must be at most 512 characters.")
    if clean_company and len(clean_company) > 512:
        raise JobValidationError("Company name must be at most 512 characters.")
    if len(clean_description) < 30:
        raise JobValidationError("Job description must be at least 30 characters.")
    if len(clean_description) > settings.max_job_description_chars:
        raise JobValidationError("Job description exceeds maximum allowed length.")

    return clean_title, clean_company, clean_description


def get_owned_job(db: Session, user: User, job_id: str) -> Job:
    record = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Job not found.")
    return record


def create_job_record(
    *,
    db: Session,
    user: User,
    title: str,
    company_name: str | None,
    job_description: str,
    source_url: str | None,
) -> Job:
    record = Job(
        user_id=user.id,
        title=title,
        company_name=company_name,
        source_url=source_url,
        job_description=job_description,
        normalized_requirements_json=normalized_requirements_to_json(job_description),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def parsed_normalized(record: Job) -> dict:
    if not record.normalized_requirements_json:
        return {}
    try:
        return json.loads(record.normalized_requirements_json)
    except json.JSONDecodeError:
        return {}
