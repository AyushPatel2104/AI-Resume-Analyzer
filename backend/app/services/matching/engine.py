import json
from typing import Any

from app.config import Settings
from app.schemas import MatchComponents, MatchResult, ParsedProfile, SkillGapItem
from app.services.job_normalization import normalize_job_requirements
from app.services.matching.explanations import build_recommendations, build_skill_gaps, build_strengths_weaknesses
from app.services.matching.scoring import weighted_overall
from app.services.matching.semantic_similarity import compute_semantic_signal
from app.services.matching.signals import (
    education_signal,
    experience_signal,
    keyword_signal,
    project_signal,
    seniority_signal,
    skill_signal,
)
from app.services.matcher import compute_match as compute_match_v1


def _parse_normalized(raw: str | dict[str, Any] | None, job_description: str) -> dict[str, Any]:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass
    return normalize_job_requirements(job_description)


def compute_match_v2(
    resume_text: str,
    profile: ParsedProfile,
    job_description: str,
    settings: Settings,
    normalized_requirements_json: str | dict[str, Any] | None = None,
) -> MatchResult:
    normalized = _parse_normalized(normalized_requirements_json, job_description)

    skill_data = skill_signal(resume_text, profile, normalized)
    semantic_score, text_similarity, semantic_method = compute_semantic_signal(resume_text, job_description, settings)
    experience = experience_signal(profile, skill_data["resume_skills"], skill_data["required_set"])
    education = education_signal(profile, normalized)
    projects = project_signal(profile, skill_data["required_set"])
    seniority = seniority_signal(profile, normalized)
    keyword = keyword_signal(resume_text, profile, normalized)

    components_for_score: dict[str, float | None] = {
        "skill": skill_data["skill_score"],
        "semantic": semantic_score,
        "text_similarity": text_similarity if semantic_score is None else None,
        "experience": experience["score"] if experience["available"] else None,
        "education": education["score"] if education["available"] else None,
        "project": projects["score"],
        "seniority": seniority["score"] if seniority["available"] else None,
        "required_coverage": skill_data["required_coverage"],
        "preferred_coverage": skill_data["preferred_coverage"],
        "keyword": keyword["score"],
    }

    weighted = weighted_overall(components_for_score, settings)
    strengths, weaknesses = build_strengths_weaknesses(
        skill_data=skill_data,
        semantic_score=semantic_score,
        semantic_method=semantic_method,
        text_similarity=text_similarity,
        experience=experience,
        education=education,
        projects=projects,
        seniority=seniority,
    )
    gaps = build_skill_gaps(skill_data)
    recommendations = build_recommendations(skill_data, profile, job_description)

    legacy_matched = list(dict.fromkeys(skill_data["matched_required_skills"] + skill_data["matched_preferred_skills"]))
    legacy_missing = skill_data["missing_required_skills"] or skill_data["missing_preferred_skills"]

    components = MatchComponents(
        skill_score=skill_data["skill_score"],
        semantic_score=semantic_score,
        semantic_available=semantic_score is not None,
        semantic_method=semantic_method,
        text_similarity_score=text_similarity,
        experience_score=experience["score"] if experience["available"] else None,
        experience_available=experience["available"],
        education_score=education["score"] if education["available"] else None,
        education_available=education["available"],
        education_requirement_specified=education.get("specified", False),
        project_score=projects["score"],
        seniority_score=seniority["score"] if seniority["available"] else None,
        seniority_available=seniority["available"],
        required_coverage=skill_data["required_coverage"],
        preferred_coverage=skill_data["preferred_coverage"],
        keyword_score=keyword["score"],
        weights_applied=weighted.weights_used,
    )

    display_semantic = semantic_score if semantic_score is not None else text_similarity

    return MatchResult(
        overall_score=weighted.overall,
        semantic_similarity=display_semantic,
        skill_coverage=skill_data["required_coverage"],
        matched_skills=legacy_matched,
        missing_skills=legacy_missing,
        strengths=strengths,
        weaknesses=weaknesses,
        relevant_experience=experience.get("entries", []),
        recommendations=recommendations,
        jd_skills_detected=[s.title() for s in normalized.get("jd_skills_detected") or skill_data["required_set"]],
        matched_required_skills=skill_data["matched_required_skills"],
        missing_required_skills=skill_data["missing_required_skills"],
        matched_preferred_skills=skill_data["matched_preferred_skills"],
        missing_preferred_skills=skill_data["missing_preferred_skills"],
        partial_matches=skill_data["partial_matches"],
        relevant_projects=projects.get("relevant_projects", []),
        skill_gaps=gaps,
        components=components,
        score_disclaimer="Explainable compatibility/match score — not a hiring probability or guarantee.",
        matcher_version="v2",
    )


def compute_match(resume_text: str, profile: ParsedProfile, job_description: str) -> MatchResult:
    """Backward-compatible V1 matcher (preserved for tests/comparison)."""
    return compute_match_v1(resume_text, profile, job_description)
