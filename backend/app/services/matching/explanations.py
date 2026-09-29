from typing import Any

from app.schemas import ParsedProfile, SkillGapItem


def build_skill_gaps(skill_data: dict[str, Any]) -> list[SkillGapItem]:
    gaps: list[SkillGapItem] = []
    for skill in skill_data["missing_required_skills"]:
        if skill.lower() in {p.lower() for p in skill_data.get("partial_matches", [])}:
            gaps.append(
                SkillGapItem(
                    item=skill,
                    severity="important",
                    detail=f"{skill} appears partially in the resume but evidence is unclear.",
                )
            )
        else:
            gaps.append(
                SkillGapItem(
                    item=skill,
                    severity="critical",
                    detail=f"{skill} is required by the job but no clear evidence was found on the resume.",
                )
            )
    for skill in skill_data["missing_preferred_skills"]:
        gaps.append(
            SkillGapItem(
                item=skill,
                severity="optional",
                detail=f"{skill} is preferred/secondary and was not clearly detected.",
            )
        )
    return gaps


def build_strengths_weaknesses(
    *,
    skill_data: dict[str, Any],
    semantic_score: float | None,
    semantic_method: str,
    text_similarity: float,
    experience: dict[str, Any],
    education: dict[str, Any],
    projects: dict[str, Any],
    seniority: dict[str, Any],
) -> tuple[list[str], list[str]]:
    strengths: list[str] = []
    weaknesses: list[str] = []

    for skill in skill_data["matched_required_skills"][:5]:
        strengths.append(f"{skill} directly matches a required skill.")
    if semantic_score is not None and semantic_method == "sentence_transformer" and semantic_score >= 60:
        strengths.append("Resume language is semantically similar to the job description (local embedding model).")
    elif text_similarity >= 60:
        strengths.append("Resume wording overlaps with the job description (TF-IDF text similarity — not deep semantic AI).")

    for entry in experience.get("entries", [])[:3]:
        strengths.append(f"Relevant experience: {entry}.")
    for project in projects.get("relevant_projects", [])[:2]:
        strengths.append(f"Project evidence: {project}.")

    for skill in skill_data["missing_required_skills"][:5]:
        weaknesses.append(f"{skill} is required but no clear evidence was found.")
    if semantic_score is not None and semantic_score < 40:
        weaknesses.append("Semantic similarity to the job description is low.")
    elif semantic_score is None and text_similarity < 40:
        weaknesses.append("Low textual overlap with the job description; consider mirroring role-specific keywords.")
    if education.get("specified") and education.get("score") == 0.0:
        weaknesses.append("Job lists education requirements that were not detected on the resume.")
    if seniority.get("available") and seniority.get("score", 100) < 50:
        weaknesses.append(
            f"Seniority alignment is weak (job: {seniority.get('job_level')}, resume signal: {seniority.get('resume_level')})."
        )

    return strengths[:8], weaknesses[:8]


def build_recommendations(skill_data: dict[str, Any], profile: ParsedProfile, job_description: str) -> list[str]:
    recs: list[str] = []
    missing = skill_data["missing_required_skills"]
    if missing:
        recs.append(
            "Add or emphasize required skills if you have them: "
            + ", ".join(missing[:5])
            + "."
        )
    if not profile.experience:
        recs.append("Include experience entries with titles, tenure, and impact bullets.")
    if skill_data["missing_preferred_skills"]:
        recs.append(
            "Preferred skills to highlight if applicable: "
            + ", ".join(skill_data["missing_preferred_skills"][:4])
            + "."
        )
    if "years" in job_description.lower():
        recs.append("Mirror explicit years-of-experience requirements when accurate.")
    recs.append("Quantify outcomes in experience and project bullets where possible.")
    return recs[:6]
