from datetime import date, datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.application_status import (
    DEFAULT_APPLICATION_STATUS,
    parse_application_source,
    parse_application_status,
)
from app.models import Analysis, Application, Job, Resume, User
from app.services.job_library import get_owned_job
from app.services.resume_library import get_owned_resume


def get_owned_application(db: Session, user: User, application_id: str) -> Application:
    record = (
        db.query(Application)
        .options(joinedload(Application.job), joinedload(Application.resume))
        .filter(Application.id == application_id, Application.user_id == user.id)
        .one_or_none()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Application not found.")
    return record


def latest_analysis_for_pair(
    db: Session,
    user_id: str,
    resume_id: str,
    job_id: str,
) -> Analysis | None:
    return (
        db.query(Analysis)
        .filter(
            Analysis.user_id == user_id,
            Analysis.resume_id == resume_id,
            Analysis.job_id == job_id,
        )
        .order_by(Analysis.created_at.desc())
        .first()
    )


def create_application(
    db: Session,
    user: User,
    *,
    job_id: str,
    resume_id: str,
    status: str | None = None,
    applied_at: datetime | None = None,
    follow_up_date: date | None = None,
    notes: str | None = None,
    source: str | None = None,
) -> Application:
    get_owned_job(db, user, job_id)
    get_owned_resume(db, user, resume_id)

    duplicate = (
        db.query(Application)
        .filter(
            Application.user_id == user.id,
            Application.job_id == job_id,
            Application.resume_id == resume_id,
        )
        .one_or_none()
    )
    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="An application already exists for this job and resume.",
        )

    try:
        app_status = parse_application_status(status or DEFAULT_APPLICATION_STATUS.value)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        app_source = parse_application_source(source)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    if notes and len(notes) > 20_000:
        raise HTTPException(status_code=422, detail="Notes exceed maximum length.")

    record = Application(
        user_id=user.id,
        job_id=job_id,
        resume_id=resume_id,
        status=app_status.value,
        applied_at=applied_at,
        follow_up_date=follow_up_date,
        notes=notes.strip() if notes else None,
        source=app_source.value if app_source else None,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An application already exists for this job and resume.",
        ) from exc
    db.refresh(record)
    return (
        db.query(Application)
        .options(joinedload(Application.job), joinedload(Application.resume))
        .filter(Application.id == record.id)
        .one()
    )


def list_applications(
    db: Session,
    user: User,
    *,
    status: str | None = None,
    job_id: str | None = None,
    resume_id: str | None = None,
    search: str | None = None,
    applied_from: date | None = None,
    applied_to: date | None = None,
    sort: str = "updated",
) -> list[Application]:
    query = (
        db.query(Application)
        .options(joinedload(Application.job), joinedload(Application.resume))
        .filter(Application.user_id == user.id)
    )

    if status:
        try:
            query = query.filter(Application.status == parse_application_status(status).value)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    if job_id:
        get_owned_job(db, user, job_id)
        query = query.filter(Application.job_id == job_id)

    if resume_id:
        get_owned_resume(db, user, resume_id)
        query = query.filter(Application.resume_id == resume_id)

    if applied_from:
        query = query.filter(Application.applied_at >= datetime.combine(applied_from, datetime.min.time(), tzinfo=timezone.utc))

    if applied_to:
        query = query.filter(Application.applied_at <= datetime.combine(applied_to, datetime.max.time(), tzinfo=timezone.utc))

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.join(Job).join(Resume).filter(
            or_(
                func.lower(Job.title).like(term),
                func.lower(Job.company_name).like(term),
                func.lower(Resume.name).like(term),
                func.lower(Application.notes).like(term),
            )
        )

    if sort == "newest":
        query = query.order_by(Application.created_at.desc())
    elif sort == "oldest":
        query = query.order_by(Application.created_at.asc())
    elif sort == "follow_up":
        query = query.order_by(
            Application.follow_up_date.is_(None),
            Application.follow_up_date.asc(),
            Application.updated_at.desc(),
        )
    else:
        query = query.order_by(Application.updated_at.desc())

    return query.all()


def status_counts(db: Session, user_id: str) -> dict[str, int]:
    rows = (
        db.query(Application.status, func.count(Application.id))
        .filter(Application.user_id == user_id)
        .group_by(Application.status)
        .all()
    )
    counts = {status: 0 for status in ("SAVED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN")}
    total = 0
    for status, count in rows:
        counts[status] = int(count)
        total += int(count)
    counts["total"] = total
    today = date.today()
    upcoming = (
        db.query(func.count(Application.id))
        .filter(
            Application.user_id == user_id,
            Application.follow_up_date.isnot(None),
            Application.follow_up_date >= today,
        )
        .scalar()
        or 0
    )
    counts["upcoming_follow_ups"] = int(upcoming)
    return counts


def update_application(
    db: Session,
    user: User,
    application_id: str,
    *,
    status: str | None = None,
    applied_at: datetime | None = None,
    applied_at_set: bool = False,
    follow_up_date: date | None = None,
    follow_up_clear: bool = False,
    notes: str | None = None,
    notes_set: bool = False,
    source: str | None = None,
    source_clear: bool = False,
) -> Application:
    record = get_owned_application(db, user, application_id)

    if status is not None:
        try:
            record.status = parse_application_status(status).value
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    if applied_at_set:
        record.applied_at = applied_at

    if follow_up_clear:
        record.follow_up_date = None
    elif follow_up_date is not None:
        record.follow_up_date = follow_up_date

    if notes_set:
        if notes and len(notes) > 20_000:
            raise HTTPException(status_code=422, detail="Notes exceed maximum length.")
        record.notes = notes.strip() if notes else None

    if source_clear:
        record.source = None
    elif source is not None:
        try:
            parsed = parse_application_source(source)
            record.source = parsed.value if parsed else None
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    db.commit()
    db.refresh(record)
    return get_owned_application(db, user, application_id)


def delete_application(db: Session, user: User, application_id: str) -> None:
    record = get_owned_application(db, user, application_id)
    db.delete(record)
    db.commit()
