import json
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.models import AnalysisRecord
from app.schemas import AnalysisDetail, AnalysisSummary, AnalyzeResponse, MatchResult, ParsedProfile
from app.services.extractor import extract_profile
from app.services.matcher import compute_match
from app.services.parser import ResumeParseError, parse_resume_bytes
from app.services.recommendations import maybe_enhance_recommendations

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalyzeResponse)
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AnalyzeResponse:
    jd = job_description.strip()
    if len(jd) < 30:
        raise HTTPException(status_code=422, detail="Job description must be at least 30 characters.")

    if not resume.filename:
        raise HTTPException(status_code=422, detail="Resume file is required.")

    safe_filename = Path(resume.filename).name
    if not safe_filename or safe_filename in {".", ".."}:
        raise HTTPException(status_code=422, detail="Invalid resume filename.")

    data = await resume.read()
    if not data:
        raise HTTPException(status_code=422, detail="Uploaded file is empty.")

    try:
        resume_text = parse_resume_bytes(safe_filename, data, settings)
    except ResumeParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    profile = extract_profile(resume_text)
    match = compute_match(resume_text, profile, jd)
    match = await maybe_enhance_recommendations(settings, profile, jd, match)

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_id = str(uuid.uuid4())
    stored_path: str | None = None
    upload_root = upload_dir.resolve()
    dest_path = (upload_root / f"{file_id}_{safe_filename}").resolve()
    try:
        dest_path.relative_to(upload_root)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail="Unable to store upload safely.") from exc
    try:
        dest_path.write_bytes(data)
        stored_path = str(dest_path)
    except OSError:
        stored_path = None

    record = AnalysisRecord(
        id=file_id,
        original_filename=safe_filename,
        file_path=stored_path,
        resume_text=resume_text,
        job_description=jd,
        parsed_profile_json=json.dumps(profile.model_dump()),
        match_result_json=json.dumps(match.model_dump()),
        overall_score=match.overall_score,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return AnalyzeResponse(
        analysis_id=record.id,
        filename=record.original_filename,
        profile=profile,
        match=match,
        created_at=record.created_at,
    )


@router.get("/history", response_model=list[AnalysisSummary])
def list_analyses(db: Session = Depends(get_db), limit: int = 20) -> list[AnalysisSummary]:
    limit = max(1, min(limit, 100))
    rows = db.query(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).limit(limit).all()
    return [
        AnalysisSummary(
            id=r.id,
            original_filename=r.original_filename,
            overall_score=r.overall_score,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/{analysis_id}", response_model=AnalysisDetail)
def get_analysis(analysis_id: str, db: Session = Depends(get_db)) -> AnalysisDetail:
    record = db.get(AnalysisRecord, analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    profile = ParsedProfile.model_validate_json(record.parsed_profile_json)
    match = MatchResult.model_validate_json(record.match_result_json)

    return AnalysisDetail(
        analysis_id=record.id,
        filename=record.original_filename,
        profile=profile,
        match=match,
        created_at=record.created_at,
        job_description=record.job_description,
    )
