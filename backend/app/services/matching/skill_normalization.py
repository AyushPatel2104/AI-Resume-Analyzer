import re

from app.services.skills_catalog import SKILL_CATALOG

# Maintainable alias map → canonical catalog token (lowercase).
_SKILL_ALIASES: dict[str, str] = {
    "reactjs": "react",
    "react.js": "react",
    "node": "node.js",
    "nodejs": "node.js",
    "postgres": "postgresql",
    "pg": "postgresql",
    "nextjs": "next.js",
    "next js": "next.js",
    "fast api": "fastapi",
    "k8s": "kubernetes",
    "kube": "kubernetes",
    "golang": "go",
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "sklearn": "scikit-learn",
    "ml": "machine learning",
    "amazon web services": "aws",
    "google cloud": "gcp",
    "google cloud platform": "gcp",
    "microsoft azure": "azure",
}


def normalize_token(raw: str) -> str | None:
    token = raw.strip().lower()
    if not token:
        return None
    token = re.sub(r"\s+", " ", token)
    if token in _SKILL_ALIASES:
        token = _SKILL_ALIASES[token]
    if token in SKILL_CATALOG:
        return token
    for skill in sorted(SKILL_CATALOG, key=len, reverse=True):
        if token == skill or token.replace(" ", "") == skill.replace(" ", ""):
            return skill
    return token if token in SKILL_CATALOG else None


def normalize_skill_list(items: list[str]) -> set[str]:
    normalized: set[str] = set()
    for item in items:
        for part in re.split(r"[,;/|•]", item):
            canonical = normalize_token(part)
            if canonical:
                normalized.add(canonical)
    return normalized


def extract_catalog_skills_from_text(text: str) -> set[str]:
    lower = text.lower()
    found: set[str] = set()
    for skill in sorted(SKILL_CATALOG, key=len, reverse=True):
        if re.search(r"\b" + re.escape(skill) + r"\b", lower):
            found.add(skill)
    return found


def resume_skill_set(profile_skills: list[str], profile_technologies: list[str], resume_text: str) -> set[str]:
    skills = normalize_skill_list(profile_skills + profile_technologies)
    skills |= extract_catalog_skills_from_text(resume_text)
    return skills
