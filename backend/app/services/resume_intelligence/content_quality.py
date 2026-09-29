import re

from app.schemas import ParsedProfile

_GENERIC = (
    "team player",
    "hard worker",
    "fast learner",
    "detail oriented",
    "go-getter",
    "synergy",
    "go-to person",
)


def content_quality(profile: ParsedProfile, resume_text: str) -> dict:
    text = (resume_text or profile.raw_text_preview or "").lower()
    issues: list[str] = []

    if profile.summary:
        if len(profile.summary) > 600:
            issues.append("Summary may be overly long for quick ATS/human scanning.")
        elif len(profile.summary.strip()) < 40:
            issues.append("Summary is very short and may lack context.")
    else:
        issues.append("No professional summary/profile text was extracted.")

    for phrase in _GENERIC:
        if phrase in text:
            issues.append(f"Generic phrase detected: '{phrase}'.")

    words = re.findall(r"[a-z]{3,}", text)
    if words:
        freq: dict[str, int] = {}
        for w in words:
            freq[w] = freq.get(w, 0) + 1
        repeated = [w for w, c in freq.items() if c >= 8 and w not in {"and", "the", "with", "for"}]
        if repeated:
            issues.append("Repetitive wording detected: " + ", ".join(repeated[:5]) + ".")

    score = 75.0 - min(35.0, len(issues) * 6.0)
    return {"score": round(max(30.0, min(100.0, score)), 1), "issues": issues[:8]}
