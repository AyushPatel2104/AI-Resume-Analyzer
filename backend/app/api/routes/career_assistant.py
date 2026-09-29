from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.config import Settings, get_settings
from app.database import get_db
from app.models import User
from app.schemas import (
    CareerAskRequest,
    CareerAskResponse,
    CareerResumeJobRequest,
    CareerReviewResponse,
    CareerRewriteTextRequest,
    RewriteResponse,
)
from app.services.career_assistant import (
    run_ask,
    run_review,
    run_rewrite_bullet,
    run_rewrite_project,
    run_rewrite_summary,
    run_skills,
)
from app.services.job_library import get_owned_job
from app.services.resume_library import get_owned_resume

router = APIRouter(prefix="/career-assistant", tags=["career-assistant"])


def _optional_job(db: Session, user: User, job_id: str | None):
    if not job_id:
        return None
    return get_owned_job(db, user, job_id)


@router.post("/review", response_model=CareerReviewResponse)
def career_review(
    body: CareerResumeJobRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> CareerReviewResponse:
    resume = get_owned_resume(db, current_user, body.resume_id)
    job = _optional_job(db, current_user, body.job_id)
    return run_review(resume, settings, job=job)


@router.post("/rewrite-summary", response_model=RewriteResponse)
def career_rewrite_summary(
    body: CareerResumeJobRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> RewriteResponse:
    resume = get_owned_resume(db, current_user, body.resume_id)
    job = _optional_job(db, current_user, body.job_id)
    return run_rewrite_summary(resume, settings, job=job)


@router.post("/rewrite-bullet", response_model=RewriteResponse)
def career_rewrite_bullet(
    body: CareerRewriteTextRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> RewriteResponse:
    resume = get_owned_resume(db, current_user, body.resume_id)
    job = _optional_job(db, current_user, body.job_id)
    return run_rewrite_bullet(resume, settings, body.selected_text, job=job)


@router.post("/rewrite-project", response_model=RewriteResponse)
def career_rewrite_project(
    body: CareerRewriteTextRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> RewriteResponse:
    resume = get_owned_resume(db, current_user, body.resume_id)
    job = _optional_job(db, current_user, body.job_id)
    return run_rewrite_project(resume, settings, body.selected_text, job=job)


@router.post("/skills", response_model=RewriteResponse)
def career_skills(
    body: CareerResumeJobRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> RewriteResponse:
    resume = get_owned_resume(db, current_user, body.resume_id)
    job = _optional_job(db, current_user, body.job_id)
    return run_skills(resume, settings, job=job)


@router.post("/ask", response_model=CareerAskResponse)
def career_ask(
    body: CareerAskRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> CareerAskResponse:
    resume = get_owned_resume(db, current_user, body.resume_id)
    job = _optional_job(db, current_user, body.job_id)
    return run_ask(resume, settings, body.message, job=job)
