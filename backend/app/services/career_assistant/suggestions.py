from app.schemas import CareerAssistantItem, CareerReviewResponse
from app.services.career_assistant.context import CareerContext

_SEVERITY_ORDER = {"Critical": 0, "Important": 1, "Suggestion": 2}


def _item(
    category: str,
    severity: str,
    title: str,
    why: str,
    evidence: str,
    action: str,
) -> CareerAssistantItem:
    return CareerAssistantItem(
        category=category,
        severity=severity,
        title=title,
        why_it_matters=why,
        evidence=evidence,
        suggested_action=action,
    )


def resume_review(ctx: CareerContext) -> CareerReviewResponse:
    strengths: list[CareerAssistantItem] = []
    weaknesses: list[CareerAssistantItem] = []
    priorities: list[CareerAssistantItem] = []

    intel = ctx.intelligence
    for key, status in intel.sections.items():
        if status.get("strength") == "strong":
            strengths.append(
                _item(
                    key.title(),
                    "Suggested",
                    f"Strong {key} section",
                    "Complete sections help parsers and recruiters scan your profile quickly.",
                    status.get("evidence", ""),
                    "Keep this section updated as your experience grows.",
                )
            )
        elif status.get("strength") in {"missing", "partial", "weak"} and key in {"contact", "summary", "skills", "experience"}:
            sev = "Important" if key in {"contact", "experience", "skills"} else "Suggestion"
            weaknesses.append(
                _item(
                    key.title(),
                    sev,
                    f"{key.title()} needs attention",
                    "Gaps here reduce clarity in automated parsing and human review.",
                    status.get("evidence", ""),
                    f"Strengthen your {key} section using only verified information from your background.",
                )
            )

    if intel.impact.get("measurable_signals"):
        strengths.append(
            _item(
                "Impact",
                "Suggested",
                "Measurable outcomes present",
                "Quantified results (when accurate) strengthen credibility.",
                ", ".join(intel.impact["measurable_signals"][:5]),
                "Continue highlighting verified metrics where they exist.",
            )
        )
    elif "Limited measurable" in (intel.impact.get("summary") or ""):
        weaknesses.append(
            _item(
                "Impact",
                "Suggestion",
                "Limited measurable impact language",
                "Without verified metrics, bullets may read as responsibility-only.",
                intel.impact.get("summary", ""),
                "Add a measurable result here if you have one — do not invent numbers.",
            )
        )

    for rec in intel.recommendations:
        item = _item(
            rec.category,
            rec.severity,
            rec.title,
            rec.explanation,
            rec.evidence,
            rec.suggested_improvement,
        )
        weaknesses.append(item)
        priorities.append(item)

    priorities.sort(key=lambda x: _SEVERITY_ORDER.get(x.severity, 99))

    return CareerReviewResponse(
        mode="resume_review" if not ctx.job else "job_specific_review",
        resume_id=ctx.resume_id,
        job_id=ctx.job.id if ctx.job else None,
        resume_health_score=intel.resume_health_score,
        strengths=strengths[:12],
        weaknesses=weaknesses[:15],
        priority_improvements=priorities[:10],
        provider="deterministic",
    )


def job_specific_review(ctx: CareerContext) -> CareerReviewResponse:
    base = resume_review(ctx)
    if not ctx.job or not ctx.match:
        return base

    match = ctx.match
    base.job_match_score = match.overall_score
    base.matcher_version = match.matcher_version

    for skill in match.missing_required_skills[:8]:
        item = _item(
            "Job alignment",
            "Critical",
            f"Missing required skill: {skill}",
            "Required skills are heavily weighted in job compatibility scoring.",
            f"Not clearly detected on resume; job lists {skill} as required.",
            f"Only add {skill} if you truly have experience — otherwise address adjacent strengths in your summary.",
        )
        base.weaknesses.insert(0, item)
        base.priority_improvements.insert(0, item)

    for skill in match.missing_preferred_skills[:5]:
        item = _item(
            "Job alignment",
            "Suggestion",
            f"Missing preferred skill: {skill}",
            "Preferred skills can differentiate similarly qualified candidates.",
            f"Preferred term '{skill}' not clearly detected.",
            f"Highlight {skill} only if it appears elsewhere in your real experience.",
        )
        base.weaknesses.append(item)

    for strength in match.strengths[:5]:
        base.strengths.append(
            _item(
                "Job alignment",
                "Suggested",
                "Relevant strength for this job",
                "Existing evidence aligns with what the role emphasizes.",
                strength,
                "Make this evidence easy to find near the top of your resume.",
            )
        )

    if ctx.job_keywords:
        for term in ctx.job_keywords.get("missing_required_terms", [])[:3]:
            base.priority_improvements.append(
                _item(
                    "Terminology",
                    "Critical",
                    f"Job terminology gap: {term}",
                    "Job descriptions and ATS filters often scan for exact role vocabulary.",
                    f"Required term '{term}' missing from resume text.",
                    f"Do not claim {term} without experience. If you have it, mirror the job's wording.",
                )
            )

    base.priority_improvements.sort(key=lambda x: _SEVERITY_ORDER.get(x.severity, 99))
    base.priority_improvements = base.priority_improvements[:12]
    base.mode = "job_specific_review"
    base.provider = "deterministic"
    return base
