from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.config import Settings, get_settings
from app.database import get_db
from app.models import Analysis, Application, User
from app.schemas import (
    ApplicationCreateRequest,
    ApplicationDetail,
    ApplicationJobSummary,
    ApplicationListResponse,
    ApplicationResumeSummary,
    ApplicationStatistics,
    ApplicationSummary,
    ApplicationUpdateRequest,
    ApplicationAnalysisLink,
)
from app.services.application_library import (
    create_application,
    delete_application,
    get_owned_application,
    latest_analysis_for_pair,
    list_applications,
    status_counts,
    update_application,
)
from app.services.job_library import parsed_normalized
from app.services.resume_intelligence import analyze_resume_intelligence
from app.services.resume_library import get_owned_resume

router = APIRouter(prefix="/applications", tags=["applications"])


def _job_summary(job) -> ApplicationJobSummary:
    normalized = parsed_normalized(job)
    location = normalized.get("location") if normalized else None
    return ApplicationJobSummary(
        id=job.id,
        title=job.title,
        company_name=job.company_name,
        source_url=job.source_url,
        location=location,
    )


def _resume_summary(resume) -> ApplicationResumeSummary:
    return ApplicationResumeSummary(id=resume.id, name=resume.name)


def _latest_analysis_map(db: Session, user_id: str, applications: list[Application]) -> dict[tuple[str, str], Analysis]:
    if not applications:
        return {}
    pairs = {(a.resume_id, a.job_id) for a in applications}
    rows = (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .all()
    )
    found: dict[tuple[str, str], Analysis] = {}
    for row in rows:
        key = (row.resume_id, row.job_id)
        if key in pairs and key not in found:
            found[key] = row
    return found


def _to_summary(app: Application, analysis: Analysis | None) -> ApplicationSummary:
    return ApplicationSummary(
        id=app.id,
        status=app.status,
        applied_at=app.applied_at,
        follow_up_date=app.follow_up_date,
        source=app.source,
        created_at=app.created_at,
        updated_at=app.updated_at,
        job=_job_summary(app.job),
        resume=_resume_summary(app.resume),
        latest_job_match_score=analysis.overall_score if analysis else None,
        latest_analysis_id=analysis.id if analysis else None,
    )


@router.post("", response_model=ApplicationDetail, status_code=201)
def post_application(
    body: ApplicationCreateRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> ApplicationDetail:
    record = create_application(
        db,
        current_user,
        job_id=body.job_id,
        resume_id=body.resume_id,
        status=body.status,
        applied_at=body.applied_at,
        follow_up_date=body.follow_up_date,
        notes=body.notes,
        source=body.source,
    )
    return get_application_detail(record.id, db, settings, current_user)


@router.get("", response_model=ApplicationListResponse)
def get_applications(
    status: str | None = Query(default=None),
    job_id: str | None = Query(default=None),
    resume_id: str | None = Query(default=None),
    search: str | None = Query(default=None, max_length=200),
    sort: str = Query(default="updated", pattern="^(newest|oldest|updated|follow_up)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApplicationListResponse:
    apps = list_applications(
        db,
        current_user,
        status=status,
        job_id=job_id,
        resume_id=resume_id,
        search=search,
        sort=sort,
    )
    analysis_map = _latest_analysis_map(db, current_user.id, apps)
    counts = status_counts(db, current_user.id)
    stats = ApplicationStatistics(
        total=counts["total"],
        saved=counts["SAVED"],
        applied=counts["APPLIED"],
        screening=counts["SCREENING"],
        interview=counts["INTERVIEW"],
        offer=counts["OFFER"],
        rejected=counts["REJECTED"],
        withdrawn=counts["WITHDRAWN"],
        upcoming_follow_ups=counts["upcoming_follow_ups"],
    )
    items = [
        _to_summary(app, analysis_map.get((app.resume_id, app.job_id)))
        for app in apps
    ]
    return ApplicationListResponse(items=items, statistics=stats)


@router.get("/{application_id}", response_model=ApplicationDetail)
def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> ApplicationDetail:
    return get_application_detail(application_id, db, settings, current_user)


def get_application_detail(
    application_id: str,
    db: Session,
    settings: Settings,
    current_user: User,
) -> ApplicationDetail:
    record = get_owned_application(db, current_user, application_id)
    analysis = latest_analysis_for_pair(db, current_user.id, record.resume_id, record.job_id)

    resume_health: float | None = None
    try:
        resume_record = get_owned_resume(db, current_user, record.resume_id)
        resume_health = analyze_resume_intelligence(resume_record, settings, job=None).resume_health_score
    except Exception:
        resume_health = None

    link = ApplicationAnalysisLink(
        analysis_id=analysis.id if analysis else None,
        job_match_score=analysis.overall_score if analysis else None,
        analyzed_at=analysis.created_at if analysis else None,
        resume_health_score=resume_health,
    )

    return ApplicationDetail(
        id=record.id,
        status=record.status,
        applied_at=record.applied_at,
        follow_up_date=record.follow_up_date,
        source=record.source,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
        job=_job_summary(record.job),
        resume=_resume_summary(record.resume),
        analysis=link,
    )


@router.patch("/{application_id}", response_model=ApplicationDetail)
def patch_application(
    application_id: str,
    body: ApplicationUpdateRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> ApplicationDetail:
    fields = body.model_dump(exclude_unset=True)
    update_application(
        db,
        current_user,
        application_id,
        status=fields.get("status"),
        applied_at=fields.get("applied_at"),
        applied_at_set="applied_at" in fields,
        follow_up_date=fields.get("follow_up_date"),
        follow_up_clear=body.clear_follow_up_date,
        notes=fields.get("notes"),
        notes_set="notes" in fields,
        source=fields.get("source"),
        source_clear=body.clear_source,
    )
    return get_application_detail(application_id, db, settings, current_user)


@router.delete("/{application_id}", status_code=204)
def remove_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    delete_application(db, current_user, application_id)
    return None
