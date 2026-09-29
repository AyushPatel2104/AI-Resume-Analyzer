from app.config import Settings
from app.models import Job, Resume
from app.schemas import (
    IntelligenceComponents,
    JobMatchSnapshot,
    ResumeIntelligenceResponse,
)
from app.services.matching.engine import compute_match_v2
from app.services.resume_intelligence.ats import parsing_risk_signals
from app.services.resume_intelligence.content_quality import content_quality
from app.services.resume_intelligence.experience_quality import experience_quality
from app.services.resume_intelligence.explanations import build_recommendations
from app.services.resume_intelligence.impact import impact_analysis
from app.services.resume_intelligence.keywords import generic_keywords, job_specific_keywords
from app.services.resume_intelligence.project_quality import project_quality
from app.services.resume_intelligence.scoring import completeness_score, structure_score, weighted_health
from app.services.resume_intelligence.sections import section_status
from app.services.resume_intelligence.skills_quality import skills_quality
from app.services.resume_library import profile_from_resume


def analyze_resume_intelligence(
    resume: Resume,
    settings: Settings,
    job: Job | None = None,
) -> ResumeIntelligenceResponse:
    profile = profile_from_resume(resume)
    text = resume.resume_text

    sections = section_status(profile, text)
    risks = parsing_risk_signals(profile, text)
    content = content_quality(profile, text)
    skills = skills_quality(profile, text)
    experience = experience_quality(profile)
    projects = project_quality(profile)
    impact = impact_analysis(profile, text)

    components_raw = {
        "completeness": completeness_score(sections),
        "structure": structure_score(sections, risks),
        "content_quality": content["score"],
        "skills_quality": skills["score"],
        "experience_quality": experience["score"] if experience["available"] else None,
        "project_quality": projects["score"] if projects["available"] else None,
        "parsing_readiness": max(20.0, 100.0 - 10.0 * sum(1 for r in risks if r.get("level") in {"likely", "detected"} and "No major" not in r.get("title", ""))),
        "impact_signals": impact["score"],
    }

    weighted = weighted_health(components_raw, settings)
    keyword_info = generic_keywords(profile, text)
    job_keywords = job_specific_keywords(profile, text, job) if job else None
    if job_keywords:
        keyword_info = {**keyword_info, **job_keywords}

    recommendations = build_recommendations(
        section_status=sections,
        parsing_risks=risks,
        content=content,
        skills=skills,
        experience=experience,
        projects=projects,
        impact=impact,
        job_keywords=job_keywords,
    )

    job_match: JobMatchSnapshot | None = None
    if job:
        match = compute_match_v2(
            text,
            profile,
            job.job_description,
            settings,
            normalized_requirements_json=job.normalized_requirements_json,
        )
        job_match = JobMatchSnapshot(
            job_id=job.id,
            job_title=job.title,
            company_name=job.company_name,
            overall_score=match.overall_score,
            matcher_version=match.matcher_version,
            disclaimer="Separate job compatibility score — not combined with resume health.",
        )

    components = IntelligenceComponents(
        completeness=components_raw["completeness"],
        structure=components_raw["structure"],
        content_quality=components_raw["content_quality"],
        skills_quality=components_raw["skills_quality"],
        experience_quality=components_raw["experience_quality"],
        experience_available=experience["available"],
        project_quality=components_raw["project_quality"],
        projects_available=projects["available"],
        parsing_readiness=components_raw["parsing_readiness"],
        impact_signals=components_raw["impact_signals"],
        weights_applied=weighted.weights_used,
    )

    return ResumeIntelligenceResponse(
        resume_id=resume.id,
        resume_health_score=weighted.overall,
        score_disclaimer=(
            "Explainable resume health / ATS-readiness signal from parsed text — "
            "not an official ATS score, hiring probability, or layout guarantee."
        ),
        sections=sections,
        parsing_risks=risks,
        content_quality=content,
        skills_quality=skills,
        experience_quality=experience,
        project_quality=projects,
        impact=impact,
        keywords=keyword_info,
        components=components,
        recommendations=recommendations,
        job_match=job_match,
    )
