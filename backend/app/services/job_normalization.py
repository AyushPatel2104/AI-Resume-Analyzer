import json
import re
from typing import Any

from app.services.matcher import _extract_jd_skills
from app.services.skills_catalog import SKILL_CATALOG

_LANGS = frozenset({"python", "javascript", "typescript", "java", "c++", "c#", "go", "golang", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "sql"})
_FRAMEWORKS = frozenset({"react", "next.js", "nextjs", "vue", "angular", "svelte", "node.js", "nodejs", "express", "fastapi", "django", "flask", "spring", "spring boot", ".net", "graphql"})
_TOOLS = frozenset({"docker", "kubernetes", "terraform", "ci/cd", "github actions", "jenkins", "linux", "git", "agile", "scrum", "jira"})
_DBS = frozenset({"postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "kafka", "rabbitmq"})
_CLOUD = frozenset({"aws", "azure", "gcp"})


def normalize_whitespace(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _split_required_preferred(lower: str) -> tuple[str, str]:
    markers = [
        ("preferred qualifications", "preferred"),
        ("nice to have", "preferred"),
        ("bonus", "preferred"),
        ("requirements", "required"),
        ("qualifications", "required"),
        ("must have", "required"),
    ]
    required_part = lower
    preferred_part = ""
    for phrase, kind in markers:
        idx = lower.find(phrase)
        if idx == -1:
            continue
        if kind == "preferred":
            preferred_part = lower[idx:]
            required_part = lower[:idx]
            break
    return required_part, preferred_part


def _skills_in_text(text: str) -> list[str]:
    found: list[str] = []
    for skill in sorted(SKILL_CATALOG, key=len, reverse=True):
        if re.search(r"\b" + re.escape(skill) + r"\b", text):
            found.append(skill)
    return list(dict.fromkeys(found))


def _first_match(patterns: list[str], text: str) -> str | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip()[:256]
    return None


def normalize_job_requirements(job_description: str) -> dict[str, Any]:
    text = normalize_whitespace(job_description)
    lower = text.lower()
    required_blob, preferred_blob = _split_required_preferred(lower)

    required_skills = _skills_in_text(required_blob or lower)
    preferred_skills = _skills_in_text(preferred_blob) if preferred_blob else []
    preferred_skills = [s for s in preferred_skills if s not in required_skills]

    all_skills = _extract_jd_skills(text)

    def pick(pool: frozenset[str], source: list[str]) -> list[str]:
        return [s for s in source if s in pool]

    education = []
    for label, pattern in [
        ("bachelor", r"\b(bachelor(?:'s)?(?: degree)?|bs\b|b\.s\.)\b"),
        ("master", r"\b(master(?:'s)?(?: degree)?|ms\b|m\.s\.|mba)\b"),
        ("phd", r"\b(ph\.?d|doctorate)\b"),
    ]:
        if re.search(pattern, lower, flags=re.IGNORECASE):
            education.append(label)

    experience_years = _first_match(
        [
            r"(\d+\+?\s*(?:years|yrs)\s+(?:of\s+)?experience)",
            r"(minimum\s+\d+\s+years)",
        ],
        text,
    )
    seniority = _first_match(
        [
            r"\b(intern|junior|mid[- ]level|senior|staff|principal|lead|manager|director)\b",
        ],
        text,
    )
    if seniority:
        seniority = seniority.lower()

    job_type = _first_match([r"\b(full[- ]time|part[- ]time|contract|internship)\b"], text)
    if job_type:
        job_type = job_type.lower()

    work_mode = None
    for mode in ("remote", "hybrid", "on-site", "onsite"):
        if re.search(rf"\b{re.escape(mode)}\b", lower):
            work_mode = mode.replace("onsite", "on-site")
            break

    location = _first_match(
        [
            r"(?:location|based in)[:\s]+([^\n|]{3,80})",
        ],
        text,
    )

    return {
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,
        "programming_languages": pick(_LANGS, all_skills),
        "frameworks": pick(_FRAMEWORKS, all_skills),
        "tools": pick(_TOOLS, all_skills),
        "databases": pick(_DBS, all_skills),
        "cloud_platforms": pick(_CLOUD, all_skills),
        "education_requirements": education,
        "experience_years": experience_years,
        "seniority_level": seniority,
        "job_type": job_type,
        "location": location,
        "work_mode": work_mode,
        "jd_skills_detected": all_skills,
    }


def normalized_requirements_to_json(job_description: str) -> str:
    return json.dumps(normalize_job_requirements(job_description))
