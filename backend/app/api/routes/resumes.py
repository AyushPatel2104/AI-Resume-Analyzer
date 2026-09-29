from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.config import Settings, get_settings
from app.database import get_db
from app.models import Resume, User
from app.schemas import ResumeDetail, ResumeIntelligenceResponse, ResumeSummary, ResumeUpdateRequest
from app.services.storage_provider import get_storage_provider
from app.services.job_library import get_owned_job
from app.services.resume_intelligence import analyze_resume_intelligence
from app.services.resume_library import get_owned_resume, ingest_uploaded_resume, profile_from_resume

router = APIRouter(prefix="/resumes", tags=["resumes"])


def _to_summary(record: Resume) -> ResumeSummary:
    profile = profile_from_resume(record)
    return ResumeSummary(
        id=record.id,
        name=record.name,
        original_filename=record.original_filename,
        file_type=record.file_type,
        file_size=record.file_size,
        created_at=record.created_at,
        updated_at=record.updated_at,
        profile_name=profile.name,
        skills_count=len(profile.skills),
    )


def _to_detail(record: Resume) -> ResumeDetail:
    return ResumeDetail(
        id=record.id,
        name=record.name,
        original_filename=record.original_filename,
        file_type=record.file_type,
        file_size=record.file_size,
        created_at=record.created_at,
        updated_at=record.updated_at,
        profile=profile_from_resume(record),
    )


@router.post("", response_model=ResumeDetail, status_code=201)
async def upload_resume(
    resume: UploadFile = File(...),
    name: str | None = Form(default=None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> ResumeDetail:
    record = await ingest_uploaded_resume(
        db=db,
        user=current_user,
        upload=resume,
        settings=settings,
        display_name=name,
    )
    return _to_detail(record)


@router.get("", response_model=list[ResumeSummary])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ResumeSummary]:
    rows = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.updated_at.desc())
        .all()
    )
    return [_to_summary(r) for r in rows]


@router.get("/{resume_id}/intelligence", response_model=ResumeIntelligenceResponse)
def get_resume_intelligence(
    resume_id: str,
    job_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> ResumeIntelligenceResponse:
    record = get_owned_resume(db, current_user, resume_id)
    job = get_owned_job(db, current_user, job_id) if job_id else None
    return analyze_resume_intelligence(record, settings, job=job)


@router.get("/{resume_id}", response_model=ResumeDetail)
def get_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResumeDetail:
    record = get_owned_resume(db, current_user, resume_id)
    return _to_detail(record)


@router.patch("/{resume_id}", response_model=ResumeDetail)
def update_resume(
    resume_id: str,
    body: ResumeUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResumeDetail:
    record = get_owned_resume(db, current_user, resume_id)
    record.name = body.name.strip()
    db.commit()
    db.refresh(record)
    return _to_detail(record)


@router.delete("/{resume_id}", status_code=204)
def delete_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> None:
    record = get_owned_resume(db, current_user, resume_id)
    get_storage_provider(settings).delete(record.stored_path)
    db.delete(record)
    db.commit()
    return None
