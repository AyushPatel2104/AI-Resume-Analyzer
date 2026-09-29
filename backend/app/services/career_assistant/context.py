from dataclasses import dataclass, field

from app.config import Settings
from app.models import Job, Resume
from app.schemas import MatchResult, ParsedProfile, ResumeIntelligenceResponse
from app.services.job_library import parsed_normalized
from app.services.matching.engine import compute_match_v2
from app.services.matching.skill_normalization import resume_skill_set
from app.services.resume_intelligence import analyze_resume_intelligence
from app.services.resume_intelligence.keywords import job_specific_keywords
from app.services.resume_library import profile_from_resume


@dataclass
class CareerContext:
    resume_id: str
    profile: ParsedProfile
    resume_text: str
    intelligence: ResumeIntelligenceResponse
    resume_skills: set[str]
    allowed_companies: set[str] = field(default_factory=set)
    allowed_titles: set[str] = field(default_factory=set)
    job: Job | None = None
    match: MatchResult | None = None
    job_keywords: dict | None = None
    normalized_job: dict | None = None


def build_career_context(resume: Resume, settings: Settings, job: Job | None = None) -> CareerContext:
    profile = profile_from_resume(resume)
    text = resume.resume_text
    intelligence = analyze_resume_intelligence(resume, settings, job=None)

    resume_skills = resume_skill_set(profile.skills, profile.technologies, text)
    companies = {e.company.strip().lower() for e in profile.experience if e.company and e.company.strip()}
    titles = {e.title.strip().lower() for e in profile.experience if e.title and e.title.strip()}

    match: MatchResult | None = None
    job_keywords: dict | None = None
    normalized_job: dict | None = None

    if job:
        match = compute_match_v2(
            text,
            profile,
            job.job_description,
            settings,
            normalized_requirements_json=job.normalized_requirements_json,
        )
        job_keywords = job_specific_keywords(profile, text, job)
        normalized_job = parsed_normalized(job)

    return CareerContext(
        resume_id=resume.id,
        profile=profile,
        resume_text=text,
        intelligence=intelligence,
        resume_skills=resume_skills,
        allowed_companies=companies,
        allowed_titles=titles,
        job=job,
        match=match,
        job_keywords=job_keywords,
        normalized_job=normalized_job,
    )
