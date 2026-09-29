import re

from app.schemas import ParsedProfile

_FRAGMENTED_LINE_MAX = 12


def parsing_risk_signals(profile: ParsedProfile, resume_text: str) -> list[dict]:
    text = (resume_text or profile.raw_text_preview or "").strip()
    signals: list[dict] = []

    if len(text) < 120:
        signals.append(
            {
                "level": "likely",
                "title": "Very little extractable text",
                "detail": "The parsed resume text is extremely short; ATS parsing may miss content.",
            }
        )

    if not profile.contact.email and not profile.contact.phone:
        signals.append(
            {
                "level": "detected",
                "title": "Contact fields not detected",
                "detail": "Email/phone were not reliably extracted from the text (may still exist in the file).",
            }
        )

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    short_lines = sum(1 for ln in lines if len(ln) <= _FRAGMENTED_LINE_MAX)
    if lines and short_lines / len(lines) > 0.55:
        signals.append(
            {
                "level": "likely",
                "title": "Fragmented text structure",
                "detail": "Many very short lines suggest column/table extraction issues in plain text.",
            }
        )

    if re.search(r"(.)\1{6,}", text):
        signals.append(
            {
                "level": "detected",
                "title": "Repeated character runs",
                "detail": "Unusual repeated characters may indicate extraction noise.",
            }
        )

    lowered = text.lower()
    if lowered.count("experience") > 3 or lowered.count("skills") > 3:
        signals.append(
            {
                "level": "likely",
                "title": "Duplicated section headings",
                "detail": "Repeated section labels may indicate duplicated or mis-ordered extracted text.",
            }
        )

    if not signals:
        signals.append(
            {
                "level": "unknown",
                "title": "No major text-level parsing risks detected",
                "detail": "This is an ATS-readiness signal from extracted text only — not a visual layout audit.",
            }
        )

    return signals
