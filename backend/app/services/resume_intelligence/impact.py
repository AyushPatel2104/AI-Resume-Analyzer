import re

from app.schemas import ParsedProfile

_MEASURABLE = re.compile(
    r"(\d+%|\d+\s*(?:users|customers|requests|ms|seconds|hours|days|weeks|months|years|x|\+?\d+k|\$\d))",
    re.I,
)
_ACTION_VERBS = re.compile(
    r"\b(built|developed|designed|implemented|led|improved|reduced|increased|delivered|automated|optimized|created|migrated|scaled)\b",
    re.I,
)


def impact_analysis(profile: ParsedProfile, resume_text: str) -> dict:
    blobs: list[str] = []
    for exp in profile.experience:
        blobs.append(" ".join(filter(None, [exp.description, exp.title, exp.company])))
    blobs.extend(profile.projects)
    blobs.append(resume_text or "")

    measurable_hits: list[str] = []
    action_hits = 0
    for blob in blobs:
        for match in _MEASURABLE.finditer(blob):
            snippet = match.group(0)
            if snippet not in measurable_hits:
                measurable_hits.append(snippet)
        action_hits += len(_ACTION_VERBS.findall(blob))

    if not measurable_hits:
        summary = "Limited measurable impact signals detected in parsed experience/projects."
        score = 35.0
    else:
        summary = f"Detected {len(measurable_hits)} measurable outcome signal(s) in resume text."
        score = min(100.0, 40.0 + len(measurable_hits) * 12.0)

    if action_hits >= 3 and not measurable_hits:
        score = max(score, 50.0)

    return {
        "score": round(score, 1),
        "measurable_signals": measurable_hits[:8],
        "action_verb_count": action_hits,
        "summary": summary,
    }
