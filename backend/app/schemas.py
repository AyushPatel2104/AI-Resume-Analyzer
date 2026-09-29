from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class ContactInfo(BaseModel):
    email: str | None = None
    phone: str | None = None
    linkedin: str | None = None
    location: str | None = None


class ExperienceItem(BaseModel):
    title: str | None = None
    company: str | None = None
    duration: str | None = None
    description: str | None = None


class EducationItem(BaseModel):
    degree: str | None = None
    institution: str | None = None
    year: str | None = None


class ParsedProfile(BaseModel):
    name: str | None = None
    contact: ContactInfo = Field(default_factory=ContactInfo)
    summary: str | None = None
    skills: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    raw_text_preview: str = ""


class SkillGapItem(BaseModel):
    item: str
    severity: str
    detail: str


class MatchComponents(BaseModel):
    skill_score: float = Field(ge=0, le=100)
    semantic_score: float | None = Field(default=None, ge=0, le=100)
    semantic_available: bool = False
    semantic_method: str = "unavailable"
    text_similarity_score: float | None = Field(default=None, ge=0, le=100)
    experience_score: float | None = Field(default=None, ge=0, le=100)
    experience_available: bool = False
    education_score: float | None = Field(default=None, ge=0, le=100)
    education_available: bool = False
    education_requirement_specified: bool = False
    project_score: float = Field(default=0.0, ge=0, le=100)
    seniority_score: float | None = Field(default=None, ge=0, le=100)
    seniority_available: bool = False
    required_coverage: float = Field(default=0.0, ge=0, le=100)
    preferred_coverage: float = Field(default=0.0, ge=0, le=100)
    keyword_score: float = Field(default=0.0, ge=0, le=100)
    weights_applied: dict[str, float] = Field(default_factory=dict)


class MatchResult(BaseModel):
    overall_score: float = Field(ge=0, le=100)
    semantic_similarity: float = Field(ge=0, le=100)
    skill_coverage: float = Field(ge=0, le=100)
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    relevant_experience: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    jd_skills_detected: list[str] = Field(default_factory=list)
    matched_required_skills: list[str] = Field(default_factory=list)
    missing_required_skills: list[str] = Field(default_factory=list)
    matched_preferred_skills: list[str] = Field(default_factory=list)
    missing_preferred_skills: list[str] = Field(default_factory=list)
    partial_matches: list[str] = Field(default_factory=list)
    relevant_projects: list[str] = Field(default_factory=list)
    skill_gaps: list[SkillGapItem] = Field(default_factory=list)
    components: MatchComponents | None = None
    score_disclaimer: str = ""
    matcher_version: str = "v1"


class AnalyzeResponse(BaseModel):
    analysis_id: str
    resume_id: str
    job_id: str
    filename: str
    profile: ParsedProfile
    match: MatchResult
    created_at: datetime


class AnalysisSummary(BaseModel):
    id: str
    resume_id: str
    job_id: str
    resume_name: str
    original_filename: str
    job_title: str
    company_name: str | None
    overall_score: float
    created_at: datetime


class AnalysisDetail(AnalyzeResponse):
    job_description: str


class HealthResponse(BaseModel):
    status: str
    app: str
    database: str


class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None
    extra: dict[str, Any] | None = None


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserPublic(BaseModel):
    id: str
    email: str
    full_name: str | None
    is_active: bool
    created_at: datetime


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class ResumeSummary(BaseModel):
    id: str
    name: str
    original_filename: str
    file_type: str
    file_size: int
    created_at: datetime
    updated_at: datetime
    profile_name: str | None = None
    skills_count: int = 0


class ResumeDetail(BaseModel):
    id: str
    name: str
    original_filename: str
    file_type: str
    file_size: int
    created_at: datetime
    updated_at: datetime
    profile: ParsedProfile


class ResumeUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class NormalizedRequirements(BaseModel):
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    programming_languages: list[str] = Field(default_factory=list)
    frameworks: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    databases: list[str] = Field(default_factory=list)
    cloud_platforms: list[str] = Field(default_factory=list)
    education_requirements: list[str] = Field(default_factory=list)
    experience_years: str | None = None
    seniority_level: str | None = None
    job_type: str | None = None
    location: str | None = None
    work_mode: str | None = None
    jd_skills_detected: list[str] = Field(default_factory=list)


class JobSummary(BaseModel):
    id: str
    title: str
    company_name: str | None
    source_url: str | None
    created_at: datetime
    updated_at: datetime


class JobDetail(BaseModel):
    id: str
    title: str
    company_name: str | None
    source_url: str | None
    job_description: str
    normalized_requirements: NormalizedRequirements | None
    created_at: datetime
    updated_at: datetime


class JobCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    company_name: str | None = Field(default=None, max_length=512)
    job_description: str = Field(min_length=30)
    source_url: str | None = Field(default=None, max_length=2048)


class JobUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    company_name: str | None = Field(default=None, max_length=512)
    job_description: str | None = Field(default=None, min_length=30)
    source_url: str | None = Field(default=None, max_length=2048)


class JobImportPreviewRequest(BaseModel):
    url: str = Field(min_length=8, max_length=2048)


class JobImportPreviewResponse(BaseModel):
    title: str
    company_name: str | None
    job_description: str
    source_url: str
    normalized_requirements: NormalizedRequirements


class IntelligenceRecommendation(BaseModel):
    category: str
    severity: str
    title: str
    explanation: str
    evidence: str
    suggested_improvement: str


class IntelligenceComponents(BaseModel):
    completeness: float = Field(ge=0, le=100)
    structure: float = Field(ge=0, le=100)
    content_quality: float = Field(ge=0, le=100)
    skills_quality: float = Field(ge=0, le=100)
    experience_quality: float | None = Field(default=None, ge=0, le=100)
    experience_available: bool = False
    project_quality: float | None = Field(default=None, ge=0, le=100)
    projects_available: bool = False
    parsing_readiness: float = Field(ge=0, le=100)
    impact_signals: float = Field(ge=0, le=100)
    weights_applied: dict[str, float] = Field(default_factory=dict)


class JobMatchSnapshot(BaseModel):
    job_id: str
    job_title: str
    company_name: str | None = None
    overall_score: float = Field(ge=0, le=100)
    matcher_version: str = "v2"
    disclaimer: str = ""


class ResumeIntelligenceResponse(BaseModel):
    resume_id: str
    resume_health_score: float = Field(ge=0, le=100)
    score_disclaimer: str
    sections: dict[str, Any] = Field(default_factory=dict)
    parsing_risks: list[dict[str, Any]] = Field(default_factory=list)
    content_quality: dict[str, Any] = Field(default_factory=dict)
    skills_quality: dict[str, Any] = Field(default_factory=dict)
    experience_quality: dict[str, Any] = Field(default_factory=dict)
    project_quality: dict[str, Any] = Field(default_factory=dict)
    impact: dict[str, Any] = Field(default_factory=dict)
    keywords: dict[str, Any] = Field(default_factory=dict)
    components: IntelligenceComponents
    recommendations: list[IntelligenceRecommendation] = Field(default_factory=list)
    job_match: JobMatchSnapshot | None = None


class CareerAssistantItem(BaseModel):
    category: str
    severity: str
    title: str
    why_it_matters: str
    evidence: str
    suggested_action: str


class CareerReviewResponse(BaseModel):
    mode: str
    resume_id: str
    job_id: str | None = None
    resume_health_score: float = Field(ge=0, le=100)
    job_match_score: float | None = Field(default=None, ge=0, le=100)
    matcher_version: str | None = None
    strengths: list[CareerAssistantItem] = Field(default_factory=list)
    weaknesses: list[CareerAssistantItem] = Field(default_factory=list)
    priority_improvements: list[CareerAssistantItem] = Field(default_factory=list)
    provider: str = "deterministic"


class RewriteResponse(BaseModel):
    original: str
    rewritten: str
    changes: list[str] = Field(default_factory=list)
    evidence_used: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    safety_notes: list[str] = Field(default_factory=list)
    provider: str = "deterministic"


class CareerResumeJobRequest(BaseModel):
    resume_id: str = Field(min_length=1, max_length=36)
    job_id: str | None = Field(default=None, max_length=36)


class CareerRewriteTextRequest(CareerResumeJobRequest):
    selected_text: str = Field(min_length=8, max_length=4000)


class CareerAskRequest(CareerResumeJobRequest):
    message: str = Field(min_length=1, max_length=2000)


class CareerAskResponse(BaseModel):
    intent: str
    answer: str
    review: CareerReviewResponse | None = None
    rewrite: RewriteResponse | None = None
    provider: str = "deterministic"


class ApplicationJobSummary(BaseModel):
    id: str
    title: str
    company_name: str | None
    source_url: str | None
    location: str | None = None


class ApplicationResumeSummary(BaseModel):
    id: str
    name: str


class ApplicationAnalysisLink(BaseModel):
    analysis_id: str | None = None
    job_match_score: float | None = Field(default=None, ge=0, le=100)
    analyzed_at: datetime | None = None
    resume_health_score: float | None = Field(default=None, ge=0, le=100)
    scores_note: str = (
        "Job match comes from the latest stored analysis when available. "
        "Resume health on detail is computed from the stored resume profile (not persisted on the application)."
    )


class ApplicationSummary(BaseModel):
    id: str
    status: str
    applied_at: datetime | None
    follow_up_date: date | None
    source: str | None
    created_at: datetime
    updated_at: datetime
    job: ApplicationJobSummary
    resume: ApplicationResumeSummary
    latest_job_match_score: float | None = None
    latest_analysis_id: str | None = None


class ApplicationDetail(BaseModel):
    id: str
    status: str
    applied_at: datetime | None
    follow_up_date: date | None
    source: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    job: ApplicationJobSummary
    resume: ApplicationResumeSummary
    analysis: ApplicationAnalysisLink


class ApplicationStatistics(BaseModel):
    total: int
    saved: int
    applied: int
    screening: int
    interview: int
    offer: int
    rejected: int
    withdrawn: int
    upcoming_follow_ups: int


class ApplicationListResponse(BaseModel):
    items: list[ApplicationSummary]
    statistics: ApplicationStatistics


class ApplicationCreateRequest(BaseModel):
    job_id: str = Field(min_length=1, max_length=36)
    resume_id: str = Field(min_length=1, max_length=36)
    status: str | None = None
    applied_at: datetime | None = None
    follow_up_date: date | None = None
    notes: str | None = Field(default=None, max_length=20000)
    source: str | None = Field(default=None, max_length=64)


class ApplicationUpdateRequest(BaseModel):
    status: str | None = None
    applied_at: datetime | None = None
    follow_up_date: date | None = None
    clear_follow_up_date: bool = False
    notes: str | None = Field(default=None, max_length=20000)
    source: str | None = Field(default=None, max_length=64)
    clear_source: bool = False
