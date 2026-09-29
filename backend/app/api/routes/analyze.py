import json
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.config import Settings, get_settings
from app.database import get_db
from app.models import Analysis, Job, Resume, User
from app.schemas import AnalysisDetail, AnalysisSummary, AnalyzeResponse, MatchResult, ParsedProfile
from app.services.job_library import JobValidationError, create_job_record, get_owned_job, validate_manual_job_fields
from app.services.job_normalization import normalized_requirements_to_json
from app.services.matching.engine import compute_match_v2
from app.services.recommendations import maybe_enhance_recommendations
from app.services.resume_library import get_owned_resume, ingest_uploaded_resume, profile_from_resume

router = APIRouter(prefix="/analyze", tags=["analyze"])


def _job_title_from_description(job_description: str) -> str:
    first_line = next((ln.strip() for ln in job_description.splitlines() if ln.strip()), "")
    if not first_line:
        return "Job description analysis"
    return first_line[:512]


def _analysis_to_detail(record: Analysis) -> AnalysisDetail:
    profile = profile_from_resume(record.resume)
    match = MatchResult.model_validate_json(record.match_result_json)
    return AnalysisDetail(
        analysis_id=record.id,
        resume_id=record.resume_id,
        job_id=record.job_id,
        filename=record.resume.original_filename,
        profile=profile,
        match=match,
        created_at=record.created_at,
        job_description=record.job.job_description,
    )


def _analyze_response(record: Analysis, resume_record: Resume, profile: ParsedProfile, match: MatchResult) -> AnalyzeResponse:
    return AnalyzeResponse(
        analysis_id=record.id,
        resume_id=resume_record.id,
        job_id=record.job_id,
        filename=resume_record.original_filename,
        profile=profile,
        match=match,
        created_at=record.created_at,
    )


async def _persist_analysis(
    *,
    db: Session,
    current_user: User,
    resume_record: Resume,
    profile: ParsedProfile,
    resume_text: str,
    job_record: Job,
    settings: Settings,
) -> AnalyzeResponse:
    jd = job_record.job_description
    match = compute_match_v2(
        resume_text,
        profile,
        jd,
        settings,
        normalized_requirements_json=job_record.normalized_requirements_json,
    )
    match = await maybe_enhance_recommendations(settings, profile, jd, match)

    analysis_id = str(uuid.uuid4())
    record = Analysis(
        id=analysis_id,
        user_id=current_user.id,
        resume_id=resume_record.id,
        job_id=job_record.id,
        match_result_json=json.dumps(match.model_dump()),
        overall_score=match.overall_score,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _analyze_response(record, resume_record, profile, match)


async def _run_match_with_new_job_from_description(
    *,
    db: Session,
    settings: Settings,
    current_user: User,
    resume_record: Resume,
    resume_text: str,
    profile: ParsedProfile,
    jd: str,
) -> AnalyzeResponse:
    title, company, description = validate_manual_job_fields(
        title=_job_title_from_description(jd),
        company_name=None,
        job_description=jd,
        settings=settings,
    )
    job_record = create_job_record(
        db=db,
        user=current_user,
        title=title,
        company_name=company,
        job_description=description,
        source_url=None,
    )
    return await _persist_analysis(
        db=db,
        current_user=current_user,
        resume_record=resume_record,
        profile=profile,
        resume_text=resume_text,
        job_record=job_record,
        settings=settings,
    )


@router.post("", response_model=AnalyzeResponse)
async def analyze_resume(
    resume_id: str | None = Form(default=None),
    job_id: str | None = Form(default=None),
    job_description: str | None = Form(default=None),
    resume: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> AnalyzeResponse:
    if resume_id and resume is not None and resume.filename:
        raise HTTPException(status_code=422, detail="Provide either resume_id or a file upload, not both.")

    resume_record: Resume | None = None
    profile: ParsedProfile | None = None
    resume_text: str | None = None

    if resume_id:
        resume_record = get_owned_resume(db, current_user, resume_id)
        profile = profile_from_resume(resume_record)
        resume_text = resume_record.resume_text
    elif resume and resume.filename:
        resume_record = await ingest_uploaded_resume(
            db=db,
            user=current_user,
            upload=resume,
            settings=settings,
            display_name=None,
        )
        profile = profile_from_resume(resume_record)
        resume_text = resume_record.resume_text
    else:
        raise HTTPException(status_code=422, detail="Provide resume_id or upload a resume file.")

    assert resume_record and profile and resume_text

    if job_id:
        if job_description and job_description.strip():
            raise HTTPException(status_code=422, detail="Provide either job_id or job_description, not both.")
        job_record = get_owned_job(db, current_user, job_id)
        return await _persist_analysis(
            db=db,
            current_user=current_user,
            resume_record=resume_record,
            profile=profile,
            resume_text=resume_text,
            job_record=job_record,
            settings=settings,
        )

    jd = (job_description or "").strip()
    if len(jd) < 30:
        raise HTTPException(
            status_code=422,
            detail="Provide job_id or a job description of at least 30 characters.",
        )

    try:
        return await _run_match_with_new_job_from_description(
            db=db,
            settings=settings,
            current_user=current_user,
            resume_record=resume_record,
            resume_text=resume_text,
            profile=profile,
            jd=jd,
        )
    except JobValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/history", response_model=list[AnalysisSummary])
def list_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 20,
) -> list[AnalysisSummary]:
    limit = max(1, min(limit, 100))
    rows = (
        db.query(Analysis)
        .options(joinedload(Analysis.resume), joinedload(Analysis.job))
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        AnalysisSummary(
            id=r.id,
            resume_id=r.resume_id,
            job_id=r.job_id,
            resume_name=r.resume.name,
            original_filename=r.resume.original_filename,
            job_title=r.job.title,
            company_name=r.job.company_name,
            overall_score=r.overall_score,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/{analysis_id}", response_model=AnalysisDetail)
def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalysisDetail:
    record = (
        db.query(Analysis)
        .options(joinedload(Analysis.resume), joinedload(Analysis.job))
        .filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id)
        .one_or_none()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    return _analysis_to_detail(record)
