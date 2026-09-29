import json
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import Resume, User
from app.schemas import ParsedProfile
from app.services.extractor import extract_profile
from app.services.storage_provider import get_storage_provider
from app.services.parser import ResumeParseError, parse_resume_bytes


def get_owned_resume(db: Session, user: User, resume_id: str) -> Resume:
    record = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == user.id)
        .one_or_none()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return record


async def ingest_uploaded_resume(
    *,
    db: Session,
    user: User,
    upload: UploadFile,
    settings: Settings,
    display_name: str | None = None,
) -> Resume:
    if not upload.filename:
        raise HTTPException(status_code=422, detail="Resume file is required.")

    safe_filename = Path(upload.filename).name
    if not safe_filename or safe_filename in {".", ".."}:
        raise HTTPException(status_code=422, detail="Invalid resume filename.")

    data = await upload.read()
    if not data:
        raise HTTPException(status_code=422, detail="Uploaded file is empty.")

    try:
        resume_text = parse_resume_bytes(safe_filename, data, settings)
    except ResumeParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    profile = extract_profile(resume_text)
    storage = get_storage_provider(settings)
    stored_path = storage.save_bytes(settings, data, safe_filename)
    file_type = Path(safe_filename).suffix.lower() or ".unknown"
    name = (display_name.strip()[:255] if display_name and display_name.strip() else None) or (
        Path(safe_filename).stem[:255] or safe_filename
    )

    record = Resume(
        user_id=user.id,
        name=name,
        original_filename=safe_filename,
        file_type=file_type,
        file_size=len(data),
        stored_path=stored_path,
        resume_text=resume_text,
        parsed_profile_json=json.dumps(profile.model_dump()),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def profile_from_resume(record: Resume) -> ParsedProfile:
    return ParsedProfile.model_validate_json(record.parsed_profile_json)
