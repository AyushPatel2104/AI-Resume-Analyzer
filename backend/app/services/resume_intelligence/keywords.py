import json
from typing import Any

from app.schemas import ParsedProfile
from app.services.job_library import parsed_normalized
from app.services.matching.skill_normalization import normalize_skill_list, resume_skill_set
from app.models import Job


def generic_keywords(profile: ParsedProfile, resume_text: str) -> dict:
    skills = sorted(resume_skill_set(profile.skills, profile.technologies, resume_text))
    return {
        "career_keywords": [s.title() for s in skills[:25]],
        "mode": "generic",
    }


def job_specific_keywords(profile: ParsedProfile, resume_text: str, job: Job) -> dict:
    normalized = parsed_normalized(job)
    if not normalized and job.normalized_requirements_json:
        try:
            normalized = json.loads(job.normalized_requirements_json)
        except json.JSONDecodeError:
            normalized = {}

    required = normalize_skill_list(normalized.get("required_skills") or [])
    preferred = normalize_skill_list(normalized.get("preferred_skills") or [])
    if not required and not preferred:
        required = normalize_skill_list(normalized.get("jd_skills_detected") or [])

    resume_skills = resume_skill_set(profile.skills, profile.technologies, resume_text)
    missing_required = sorted(required - resume_skills)
    missing_preferred = sorted(preferred - resume_skills)
    matched_required = sorted(required & resume_skills)
    matched_preferred = sorted(preferred & resume_skills)

    return {
        "mode": "job_specific",
        "job_id": job.id,
        "job_title": job.title,
        "missing_required_terms": [s.title() for s in missing_required],
        "missing_preferred_terms": [s.title() for s in missing_preferred],
        "matched_required_terms": [s.title() for s in matched_required],
        "matched_preferred_terms": [s.title() for s in matched_preferred],
    }
