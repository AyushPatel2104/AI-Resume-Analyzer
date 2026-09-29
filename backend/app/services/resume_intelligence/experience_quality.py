import re

from app.schemas import ParsedProfile

_GENERIC_PHRASES = (
    "responsible for",
    "duties included",
    "worked on various",
    "helped with",
    "team player",
    "hard worker",
)


def experience_quality(profile: ParsedProfile) -> dict:
    if not profile.experience:
        return {"available": False, "score": None, "issues": ["No experience entries were parsed."]}

    issues: list[str] = []
    strong = 0
    for exp in profile.experience:
        desc = (exp.description or "").strip()
        title = (exp.title or "").strip()
        company = (exp.company or "").strip()
        if not title and not company:
            issues.append("An experience entry is missing role/company context.")
        if not desc or len(desc) < 25:
            issues.append(f"Experience entry '{title or company or 'unknown'}' has a very short description.")
            continue
        lower = desc.lower()
        if any(phrase in lower for phrase in _GENERIC_PHRASES):
            issues.append(f"Generic phrasing detected in experience: {title or company}.")
        if re.search(r"\b(python|java|react|api|sql|cloud|docker|kubernetes)\b", lower):
            strong += 1
        if not re.search(r"\b(built|led|designed|implemented|delivered|improved|created)\b", lower):
            issues.append(f"Limited action-oriented language in: {title or company}.")

    score = 55.0 + min(35.0, strong * 8.0) - min(25.0, len(issues) * 4.0)
    score = round(max(20.0, min(100.0, score)), 1)
    return {"available": True, "score": score, "issues": list(dict.fromkeys(issues))[:8]}
