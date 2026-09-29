import re

from app.schemas import ContactInfo, EducationItem, ExperienceItem, ParsedProfile
from app.services.parser import normalize_whitespace
from app.services.skills_catalog import SKILL_CATALOG

EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}\b")
LINKEDIN_RE = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+", re.I)

SECTION_HEADERS = {
    "experience": re.compile(r"^(experience|work experience|professional experience|employment)\s*$", re.I | re.M),
    "education": re.compile(r"^(education|academic background)\s*$", re.I | re.M),
    "skills": re.compile(r"^(skills|technical skills|core competencies)\s*$", re.I | re.M),
    "projects": re.compile(r"^(projects|personal projects|selected projects)\s*$", re.I | re.M),
    "certifications": re.compile(r"^(certifications?|licenses?)\s*$", re.I | re.M),
    "summary": re.compile(r"^(summary|professional summary|profile|about)\s*$", re.I | re.M),
}


def _find_skills_in_text(text: str) -> list[str]:
    lower = text.lower()
    found: list[str] = []
    for skill in sorted(SKILL_CATALOG, key=len, reverse=True):
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, lower):
            found.append(skill.title() if skill.islower() else skill)
    return list(dict.fromkeys(found))


def _guess_name(lines: list[str]) -> str | None:
    for line in lines[:8]:
        cleaned = line.strip()
        if not cleaned or len(cleaned) > 60:
            continue
        if EMAIL_RE.search(cleaned) or PHONE_RE.search(cleaned):
            continue
        if re.match(r"^(resume|curriculum vitae|cv)\s*$", cleaned, re.I):
            continue
        if re.search(r"[|@#]", cleaned):
            continue
        words = cleaned.split()
        if 2 <= len(words) <= 5 and all(w[0].isupper() for w in words if w.isalpha()):
            return cleaned
    return lines[0].strip()[:80] if lines else None


def _split_sections(text: str) -> dict[str, str]:
    sections: dict[str, str] = {"body": text}
    markers: list[tuple[int, str]] = []
    for key, pattern in SECTION_HEADERS.items():
        for match in pattern.finditer(text):
            markers.append((match.start(), key))
    markers.sort(key=lambda x: x[0])
    if not markers:
        return sections

    for i, (start, key) in enumerate(markers):
        end = markers[i + 1][0] if i + 1 < len(markers) else len(text)
        chunk = text[start:end]
        chunk = re.sub(r"^[^\n]+\n", "", chunk, count=1).strip()
        sections[key] = chunk
    return sections


def _parse_bullet_lines(section: str, limit: int = 12) -> list[str]:
    items: list[str] = []
    for line in section.splitlines():
        line = line.strip()
        if not line:
            continue
        line = re.sub(r"^[\u2022\-\*•]\s*", "", line)
        if len(line) > 12:
            items.append(line)
        if len(items) >= limit:
            break
    return items


def _parse_experience(section: str) -> list[ExperienceItem]:
    blocks = re.split(r"\n{2,}", section.strip())
    items: list[ExperienceItem] = []
    for block in blocks[:8]:
        lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
        if not lines:
            continue
        title = lines[0]
        company = lines[1] if len(lines) > 1 else None
        duration = None
        for ln in lines[1:4]:
            if re.search(r"\b(20\d{2}|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b", ln, re.I):
                duration = ln
                break
        desc = " ".join(lines[2:6]) if len(lines) > 2 else None
        items.append(ExperienceItem(title=title, company=company, duration=duration, description=desc))
    return items


def _parse_education(section: str) -> list[EducationItem]:
    items: list[EducationItem] = []
    for block in re.split(r"\n{2,}", section.strip())[:6]:
        lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
        if not lines:
            continue
        degree = lines[0]
        institution = lines[1] if len(lines) > 1 else None
        year = None
        for ln in lines:
            m = re.search(r"\b(19|20)\d{2}\b", ln)
            if m:
                year = m.group(0)
                break
        items.append(EducationItem(degree=degree, institution=institution, year=year))
    return items


def extract_profile(resume_text: str) -> ParsedProfile:
    text = normalize_whitespace(resume_text)
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    sections = _split_sections(text)

    email = EMAIL_RE.search(text)
    phone = PHONE_RE.search(text)
    linkedin = LINKEDIN_RE.search(text)

    skills_section = sections.get("skills", "")
    skills = _find_skills_in_text(skills_section or text)
    technologies = [s for s in skills if s.lower() in {
        "python", "javascript", "typescript", "react", "next.js", "fastapi", "docker", "kubernetes", "aws", "postgresql"
    } or any(c in s.lower() for c in ("api", "sql", "cloud", "ml", "data"))]

    profile = ParsedProfile(
        name=_guess_name(lines),
        contact=ContactInfo(
            email=email.group(0) if email else None,
            phone=phone.group(0) if phone else None,
            linkedin=linkedin.group(0) if linkedin else None,
        ),
        summary=sections.get("summary", "")[:1200] or None,
        skills=skills,
        technologies=technologies or skills[:10],
        education=_parse_education(sections.get("education", "")),
        experience=_parse_experience(sections.get("experience", "")),
        projects=_parse_bullet_lines(sections.get("projects", "")),
        certifications=_parse_bullet_lines(sections.get("certifications", "")),
        raw_text_preview=text[:500],
    )
    return profile
