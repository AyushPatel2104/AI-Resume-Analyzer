from app.schemas import ParsedProfile
from app.services.matching.skill_normalization import extract_catalog_skills_from_text, normalize_skill_list


def skills_quality(profile: ParsedProfile, resume_text: str) -> dict:
    declared = normalize_skill_list(profile.skills + profile.technologies)
    inferred = extract_catalog_skills_from_text(resume_text or profile.raw_text_preview)
    missing_in_section = sorted(inferred - declared)

    duplicates = len(profile.skills) - len({s.lower() for s in profile.skills if s.strip()})
    issues: list[str] = []
    if not declared:
        issues.append("No skills/technologies were extracted into structured fields.")
    if missing_in_section:
        issues.append(
            "Technologies appear elsewhere in the resume but not in the skills section: "
            + ", ".join(s.title() for s in missing_in_section[:6])
        )
    if duplicates > 0:
        issues.append("Possible duplicate skill entries detected.")

    score = 40.0
    if declared:
        score += min(40.0, len(declared) * 3.0)
    if missing_in_section:
        score -= min(15.0, len(missing_in_section) * 2.0)
    score = round(max(20.0, min(100.0, score)), 1)
    return {
        "score": score,
        "declared_skills_count": len(declared),
        "inferred_skills_count": len(inferred),
        "missing_in_skills_section": [s.title() for s in missing_in_section[:12]],
        "issues": issues,
    }
