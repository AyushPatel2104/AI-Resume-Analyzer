import re

from app.schemas import ParsedProfile

_SECTION_HEADING_PATTERNS = {
    "summary": re.compile(r"\b(summary|profile|about me|professional summary)\b", re.I),
    "skills": re.compile(r"\b(skills|technical skills|core competencies)\b", re.I),
    "experience": re.compile(r"\b(experience|work history|employment)\b", re.I),
    "education": re.compile(r"\b(education|academic)\b", re.I),
    "projects": re.compile(r"\b(projects|personal projects)\b", re.I),
    "certifications": re.compile(r"\b(certifications|certificates|licenses)\b", re.I),
}


def section_status(profile: ParsedProfile, resume_text: str) -> dict[str, dict]:
    text = resume_text or profile.raw_text_preview or ""
    statuses: dict[str, dict] = {}

    def _status(detected: bool, evidence: str, strength: str) -> dict:
        return {"detected": detected, "evidence": evidence, "strength": strength}

    contact_ok = bool(profile.name or profile.contact.email or profile.contact.phone)
    statuses["contact"] = _status(
        contact_ok,
        "Contact fields parsed from resume text.",
        "strong" if profile.contact.email and profile.name else "partial" if contact_ok else "missing",
    )

    has_summary = bool(profile.summary and len(profile.summary.strip()) >= 20)
    heading_summary = bool(_SECTION_HEADING_PATTERNS["summary"].search(text))
    statuses["summary"] = _status(
        has_summary or heading_summary,
        "Summary/profile section or text block.",
        "strong" if has_summary else "partial" if heading_summary else "missing",
    )

    has_skills = len(profile.skills) >= 3 or len(profile.technologies) >= 2
    statuses["skills"] = _status(
        has_skills or bool(_SECTION_HEADING_PATTERNS["skills"].search(text)),
        f"{len(profile.skills)} skills and {len(profile.technologies)} technologies extracted.",
        "strong" if has_skills else "partial" if profile.skills else "missing",
    )

    has_exp = len(profile.experience) > 0
    statuses["experience"] = _status(
        has_exp,
        f"{len(profile.experience)} experience entries parsed.",
        "strong" if has_exp else "missing",
    )

    has_edu = len(profile.education) > 0
    statuses["education"] = _status(
        has_edu or bool(_SECTION_HEADING_PATTERNS["education"].search(text)),
        f"{len(profile.education)} education entries parsed.",
        "strong" if has_edu else "partial" if _SECTION_HEADING_PATTERNS["education"].search(text) else "weak",
    )

    has_projects = len(profile.projects) > 0
    statuses["projects"] = _status(
        has_projects,
        f"{len(profile.projects)} projects parsed.",
        "strong" if has_projects else "optional_missing",
    )

    has_certs = len(profile.certifications) > 0
    statuses["certifications"] = _status(
        has_certs,
        f"{len(profile.certifications)} certifications parsed.",
        "strong" if has_certs else "optional_missing",
    )

    return statuses
