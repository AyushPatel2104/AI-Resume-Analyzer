import re
from typing import Any

from app.schemas import ParsedProfile
from app.services.matching.skill_normalization import normalize_skill_list, resume_skill_set

_SENIORITY_ORDER = ["intern", "entry", "junior", "mid", "senior", "staff", "lead", "principal", "manager", "director"]


def _coverage(required: set[str], available: set[str]) -> tuple[float, list[str], list[str]]:
    if not required:
        return 100.0, sorted(available & required), []
    matched = required & available
    missing = required - available
    return (len(matched) / len(required)) * 100.0, sorted(matched), sorted(missing)


def skill_signal(
    resume_text: str,
    profile: ParsedProfile,
    normalized: dict[str, Any],
) -> dict[str, Any]:
    resume_skills = resume_skill_set(profile.skills, profile.technologies, resume_text)
    required = normalize_skill_list(normalized.get("required_skills") or [])
    preferred = normalize_skill_list(normalized.get("preferred_skills") or [])
    if not required and not preferred:
        jd_skills = normalize_skill_list(normalized.get("jd_skills_detected") or [])
        required = jd_skills

    req_cov, req_matched, req_missing = _coverage(required, resume_skills)
    pref_cov, pref_matched, pref_missing = _coverage(preferred, resume_skills) if preferred else (100.0, [], [])

    partial: list[str] = []
    for skill in req_missing:
        if any(skill in blob for blob in _resume_blobs(profile, resume_text)):
            partial.append(skill)

    skill_score = 0.0
    if required or preferred:
        skill_score = 0.7 * req_cov + 0.3 * (pref_cov if preferred else req_cov)
    else:
        skill_score = 0.0

    return {
        "skill_score": round(skill_score, 1),
        "required_coverage": round(req_cov, 1),
        "preferred_coverage": round(pref_cov, 1),
        "matched_required_skills": [s.title() for s in req_matched],
        "missing_required_skills": [s.title() for s in req_missing],
        "matched_preferred_skills": [s.title() for s in pref_matched],
        "missing_preferred_skills": [s.title() for s in pref_missing],
        "partial_matches": [s.title() for s in partial],
        "resume_skills": resume_skills,
        "required_set": required,
        "preferred_set": preferred,
    }


def _resume_blobs(profile: ParsedProfile, resume_text: str) -> list[str]:
    blobs = [resume_text.lower()]
    for exp in profile.experience:
        blobs.append(" ".join(filter(None, [exp.title, exp.company, exp.description])).lower())
    for project in profile.projects:
        blobs.append(project.lower())
    return blobs


def experience_signal(profile: ParsedProfile, resume_skills: set[str], required: set[str]) -> dict[str, Any]:
    if not profile.experience:
        return {"available": False, "score": None, "entries": [], "years_available": False, "years": None}

    relevant: list[str] = []
    matched_tech: set[str] = set()
    for exp in profile.experience[:8]:
        blob = " ".join(filter(None, [exp.title, exp.company, exp.description])).lower()
        overlap = {s for s in required if s in blob} if required else resume_skills & extract_words(blob)
        if overlap:
            matched_tech |= overlap
            label = " — ".join(filter(None, [exp.title, exp.company]))
            relevant.append(label or (exp.description or "")[:120])
        elif exp.title and not required:
            relevant.append(" — ".join(filter(None, [exp.title, exp.company])))

    if not relevant and profile.experience:
        return {"available": True, "score": 30.0, "entries": [], "years_available": False, "years": None}

    ratio = len(relevant) / max(1, len(profile.experience))
    tech_ratio = (len(matched_tech) / len(required)) if required else 0.5
    score = round(min(100.0, 50.0 * ratio + 50.0 * tech_ratio), 1)

    years = _parse_years_from_experience(profile)
    return {
        "available": True,
        "score": score,
        "entries": relevant[:5],
        "years_available": years is not None,
        "years": years,
        "matched_technologies": sorted(matched_tech),
    }


def extract_words(blob: str) -> set[str]:
    return {w for w in re.findall(r"[a-z0-9+#.]+", blob.lower()) if len(w) > 2}


def _parse_years_from_experience(profile: ParsedProfile) -> float | None:
    durations = " ".join(filter(None, [e.duration for e in profile.experience]))
    match = re.search(r"(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)", durations, flags=re.I)
    if match:
        return float(match.group(1))
    return None


def education_signal(profile: ParsedProfile, normalized: dict[str, Any]) -> dict[str, Any]:
    requirements = [r.lower() for r in normalized.get("education_requirements") or []]
    if not requirements:
        return {"available": False, "specified": False, "score": None}

    if not profile.education:
        return {"available": True, "specified": True, "score": 0.0}

    resume_edu = " ".join(
        " ".join(filter(None, [e.degree, e.institution])).lower() for e in profile.education
    )
    hits = sum(1 for req in requirements if req in resume_edu or (req == "bachelor" and "bs" in resume_edu))
    score = round((hits / len(requirements)) * 100.0, 1)
    return {"available": True, "specified": True, "score": score}


def project_signal(profile: ParsedProfile, required: set[str]) -> dict[str, Any]:
    if not profile.projects:
        return {"score": 0.0 if required else 50.0, "relevant_projects": []}

    relevant: list[str] = []
    for project in profile.projects[:10]:
        blob = project.lower()
        if required and any(skill in blob for skill in required):
            relevant.append(project[:160])
        elif not required and len(blob) > 20:
            relevant.append(project[:160])

    if not relevant:
        return {"score": 20.0, "relevant_projects": []}
    score = round(min(100.0, (len(relevant) / len(profile.projects)) * 100.0), 1)
    return {"score": score, "relevant_projects": relevant[:5]}


def _normalize_seniority(value: str | None) -> str | None:
    if not value:
        return None
    lower = value.lower()
    for level in _SENIORITY_ORDER:
        if level in lower:
            return level
    return None


def seniority_signal(profile: ParsedProfile, normalized: dict[str, Any]) -> dict[str, Any]:
    job_level = _normalize_seniority(normalized.get("seniority_level"))
    if not job_level:
        return {"available": False, "score": None, "job_level": None, "resume_level": None}

    resume_level = None
    for exp in profile.experience:
        resume_level = _normalize_seniority(exp.title) or resume_level
    if not resume_level:
        return {"available": False, "score": None, "job_level": job_level, "resume_level": None}

    job_idx = _SENIORITY_ORDER.index(job_level) if job_level in _SENIORITY_ORDER else 2
    resume_idx = _SENIORITY_ORDER.index(resume_level) if resume_level in _SENIORITY_ORDER else 2
    distance = abs(job_idx - resume_idx)
    score = round(max(0.0, 100.0 - distance * 25.0), 1)
    return {"available": True, "score": score, "job_level": job_level, "resume_level": resume_level}


def keyword_signal(resume_text: str, profile: ParsedProfile, normalized: dict[str, Any]) -> dict[str, Any]:
    terms: set[str] = set()
    for key in (
        "programming_languages",
        "frameworks",
        "tools",
        "databases",
        "cloud_platforms",
        "required_skills",
        "preferred_skills",
    ):
        terms |= normalize_skill_list([str(t) for t in normalized.get(key) or []])

    terms -= {"", "api", "rest"}
    if not terms:
        return {"score": 50.0, "matched_terms": []}

    resume_skills = resume_skill_set(profile.skills, profile.technologies, resume_text)
    matched = terms & resume_skills
    score = round((len(matched) / len(terms)) * 100.0, 1)
    return {"score": score, "matched_terms": [t.title() for t in sorted(matched)]}
