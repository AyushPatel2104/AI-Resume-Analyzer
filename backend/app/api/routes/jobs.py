from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.config import Settings, get_settings
from app.database import get_db
from app.models import Job, User
from app.schemas import (
    JobCreateRequest,
    JobDetail,
    JobImportPreviewRequest,
    JobImportPreviewResponse,
    JobSummary,
    JobUpdateRequest,
    NormalizedRequirements,
)
from app.services.job_import import preview_job_import_from_url
from app.services.job_library import (
    JobValidationError,
    create_job_record,
    get_owned_job,
    parsed_normalized,
    validate_manual_job_fields,
)
from app.services.job_normalization import normalized_requirements_to_json
from app.services.job_url_fetch import JobUrlFetchError

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _normalized_model(record: Job) -> NormalizedRequirements | None:
    data = parsed_normalized(record)
    if not data:
        return None
    return NormalizedRequirements.model_validate(data)


def _to_summary(record: Job) -> JobSummary:
    return JobSummary(
        id=record.id,
        title=record.title,
        company_name=record.company_name,
        source_url=record.source_url,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


def _to_detail(record: Job) -> JobDetail:
    return JobDetail(
        id=record.id,
        title=record.title,
        company_name=record.company_name,
        source_url=record.source_url,
        job_description=record.job_description,
        normalized_requirements=_normalized_model(record),
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.post("/import/preview", response_model=JobImportPreviewResponse)
async def preview_job_import(
    body: JobImportPreviewRequest,
    settings: Settings = Depends(get_settings),
    _current_user: User = Depends(get_current_user),
) -> JobImportPreviewResponse:
    try:
        preview = await preview_job_import_from_url(body.url, settings)
    except JobUrlFetchError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return JobImportPreviewResponse(
        title=preview["title"],
        company_name=preview.get("company_name"),
        job_description=preview["job_description"],
        source_url=preview["source_url"],
        normalized_requirements=NormalizedRequirements.model_validate(preview["normalized_requirements"]),
    )


@router.post("", response_model=JobDetail, status_code=201)
def create_job(
    body: JobCreateRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> JobDetail:
    try:
        title, company, description = validate_manual_job_fields(
            title=body.title,
            company_name=body.company_name,
            job_description=body.job_description,
            settings=settings,
        )
    except JobValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    source_url = body.source_url.strip() if body.source_url else None
    if source_url and len(source_url) > 2048:
        raise HTTPException(status_code=422, detail="Source URL is too long.")

    record = create_job_record(
        db=db,
        user=current_user,
        title=title,
        company_name=company,
        job_description=description,
        source_url=source_url,
    )
    return _to_detail(record)


@router.get("", response_model=list[JobSummary])
def list_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[JobSummary]:
    rows = (
        db.query(Job)
        .filter(Job.user_id == current_user.id)
        .order_by(Job.updated_at.desc())
        .all()
    )
    return [_to_summary(r) for r in rows]


@router.get("/{job_id}", response_model=JobDetail)
def get_job(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> JobDetail:
    return _to_detail(get_owned_job(db, current_user, job_id))


@router.patch("/{job_id}", response_model=JobDetail)
def update_job(
    job_id: str,
    body: JobUpdateRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> JobDetail:
    record = get_owned_job(db, current_user, job_id)
    title = body.title if body.title is not None else record.title
    company = body.company_name if body.company_name is not None else record.company_name
    description = body.job_description if body.job_description is not None else record.job_description

    try:
        title, company, description = validate_manual_job_fields(
            title=title,
            company_name=company,
            job_description=description,
            settings=settings,
        )
    except JobValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    record.title = title
    record.company_name = company
    record.job_description = description
    if body.source_url is not None:
        record.source_url = body.source_url.strip() or None
    record.normalized_requirements_json = normalized_requirements_to_json(description)
    db.commit()
    db.refresh(record)
    return _to_detail(record)


@router.delete("/{job_id}", status_code=204)
def delete_job(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    record = get_owned_job(db, current_user, job_id)
    db.delete(record)
    db.commit()
    return None
