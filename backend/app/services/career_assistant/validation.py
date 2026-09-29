import re

from app.services.matching.skill_normalization import extract_catalog_skills_from_text, normalize_token

_MEASURABLE_PATTERN = re.compile(
    r"(\d+%|\d+\s*(?:users|customers|requests|ms|seconds|hours|days|weeks|months|years|x|\+?\d+k|\$\d[\d,]*))",
    re.I,
)

_MAX_SELECTED_TEXT = 4000


def clamp_selected_text(text: str, max_len: int = _MAX_SELECTED_TEXT) -> str:
    cleaned = (text or "").strip()
    if len(cleaned) > max_len:
        raise ValueError(f"Selected text exceeds {max_len} characters.")
    return cleaned


def text_belongs_to_resume(selected: str, resume_text: str, profile_text_blobs: list[str]) -> bool:
    needle = re.sub(r"\s+", " ", selected.strip().lower())
    if len(needle) < 8:
        return False
    haystacks = [resume_text.lower()] + [b.lower() for b in profile_text_blobs if b]
    normalized_hay = [re.sub(r"\s+", " ", h) for h in haystacks]
    return any(needle in h for h in normalized_hay)


def profile_text_blobs(profile) -> list[str]:
    blobs: list[str] = []
    if profile.summary:
        blobs.append(profile.summary)
    for exp in profile.experience:
        blobs.extend(filter(None, [exp.description, exp.title, exp.company]))
    blobs.extend(profile.projects)
    return blobs


def measurable_tokens(text: str) -> set[str]:
    return {m.group(0).lower() for m in _MEASURABLE_PATTERN.finditer(text or "")}


def find_new_measurable_claims(original: str, rewritten: str) -> list[str]:
    new_tokens = measurable_tokens(rewritten) - measurable_tokens(original)
    return sorted(new_tokens)


def catalog_skills_in_text(text: str) -> set[str]:
    return extract_catalog_skills_from_text(text or "")


def find_unsupported_skills(
    rewritten: str,
    *,
    resume_skills: set[str],
    original_text: str,
    job_required_missing: set[str] | None = None,
) -> list[str]:
    """Skills appearing in rewrite that were not in original or on resume (blocked)."""
    orig_skills = catalog_skills_in_text(original_text)
    allowed = resume_skills | orig_skills
    in_rewrite = catalog_skills_in_text(rewritten)
    unsupported = sorted(s for s in in_rewrite if s not in allowed)
    if job_required_missing:
        for skill in job_required_missing:
            if skill in in_rewrite and skill not in allowed:
                if skill not in unsupported:
                    unsupported.append(skill)
    return unsupported


def sanitize_rewrite_or_raise(
    original: str,
    rewritten: str,
    *,
    resume_skills: set[str],
    job_missing_skills: set[str] | None = None,
) -> tuple[str, list[str], list[str]]:
    """
    Returns (safe_text, missing_information, validation_issues).
    Strips sentences that introduce unsupported catalog skills.
    """
    missing: list[str] = []
    issues: list[str] = []

    new_metrics = find_new_measurable_claims(original, rewritten)
    if new_metrics:
        issues.append("Rewrite introduced measurable claims not present in the original.")
        missing.append("No measurable performance result found in original text — use a placeholder instead.")
        for token in new_metrics:
            rewritten = rewritten.replace(token, "[add measured improvement if available]")

    job_missing = job_missing_skills or set()
    unsupported = find_unsupported_skills(
        rewritten,
        resume_skills=resume_skills,
        original_text=original,
        job_required_missing=job_missing,
    )
    for skill in unsupported:
        issues.append(f"Unsupported skill reference: {skill}")
        pattern = re.compile(r"\b" + re.escape(skill) + r"\b", re.I)
        rewritten = pattern.sub(f"[{skill} — only include if you have this experience]", rewritten)

    return rewritten.strip(), missing, issues


def normalize_job_missing_skills(job_keywords: dict | None) -> set[str]:
    if not job_keywords:
        return set()
    missing = job_keywords.get("missing_required_terms") or []
    out: set[str] = set()
    for term in missing:
        canonical = normalize_token(str(term))
        if canonical:
            out.add(canonical)
    return out
