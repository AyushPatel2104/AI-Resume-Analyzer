from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


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


class AnalyzeResponse(BaseModel):
    analysis_id: str
    filename: str
    profile: ParsedProfile
    match: MatchResult
    created_at: datetime


class AnalysisSummary(BaseModel):
    id: str
    original_filename: str
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
