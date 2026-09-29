import re

from app.schemas import ParsedProfile


def project_quality(profile: ParsedProfile) -> dict:
    if not profile.projects:
        return {"available": False, "score": None, "issues": []}

    issues: list[str] = []
    strong = 0
    for project in profile.projects[:10]:
        text = project.strip()
        if len(text) < 20:
            issues.append("A project entry is extremely short.")
            continue
        if re.search(r"\b(python|react|api|sql|docker|aws|fastapi|node)\b", text.lower()):
            strong += 1
        else:
            issues.append("A project mentions limited technology context.")
        if not re.search(r"\b(built|developed|implemented|designed|created)\b", text.lower()):
            issues.append("A project lacks clear action/outcome wording.")

    score = 50.0 + min(40.0, strong * 10.0) - min(20.0, len(issues) * 3.0)
    return {"available": True, "score": round(max(25.0, min(100.0, score)), 1), "issues": list(dict.fromkeys(issues))[:6]}
