from app.schemas import IntelligenceRecommendation


def _rec(category: str, severity: str, title: str, explanation: str, evidence: str) -> IntelligenceRecommendation:
    return IntelligenceRecommendation(
        category=category,
        severity=severity,
        title=title,
        explanation=explanation,
        evidence=evidence,
        suggested_improvement=explanation,
    )


def build_recommendations(
    *,
    section_status: dict,
    parsing_risks: list[dict],
    content: dict,
    skills: dict,
    experience: dict,
    projects: dict,
    impact: dict,
    job_keywords: dict | None,
) -> list[IntelligenceRecommendation]:
    recs: list[IntelligenceRecommendation] = []

    if section_status.get("contact", {}).get("strength") != "strong":
        recs.append(
            _rec(
                "Contact",
                "Important",
                "Strengthen contact completeness",
                "Include name and at least one reliable contact method if you want recruiters to reach you.",
                section_status.get("contact", {}).get("evidence", ""),
            )
        )

    if section_status.get("summary", {}).get("strength") == "missing":
        recs.append(
            _rec(
                "Summary",
                "Suggestion",
                "Add a concise professional summary",
                "A short summary can help parsers and recruiters understand your focus quickly.",
                "No summary/profile text was extracted.",
            )
        )

    for issue in content.get("issues", [])[:3]:
        recs.append(_rec("Summary", "Suggestion", "Improve summary/content clarity", issue, issue))

    for issue in skills.get("issues", [])[:3]:
        recs.append(_rec("Skills", "Important", "Improve skills section", issue, issue))

    for issue in experience.get("issues", [])[:4]:
        sev = "Important" if "missing" in issue.lower() or "short" in issue.lower() else "Suggestion"
        recs.append(_rec("Experience", sev, "Strengthen experience bullets", issue, issue))

    for issue in projects.get("issues", [])[:2]:
        recs.append(_rec("Projects", "Suggestion", "Clarify project descriptions", issue, issue))

    for risk in parsing_risks:
        if risk.get("level") in {"likely", "detected"} and "No major" not in risk.get("title", ""):
            recs.append(
                _rec(
                    "ATS parsing",
                    "Important",
                    risk["title"],
                    risk["detail"],
                    risk["detail"],
                )
            )

    if "Limited measurable" in impact.get("summary", ""):
        recs.append(
            _rec(
                "Impact",
                "Suggestion",
                "Add measurable outcomes where accurate",
                impact["summary"],
                "No fabricated metrics — only add numbers you can substantiate.",
            )
        )

    if job_keywords and job_keywords.get("mode") == "job_specific":
        for term in job_keywords.get("missing_required_terms", [])[:5]:
            recs.append(
                _rec(
                    "Job alignment",
                    "Critical",
                    f"Missing required job term: {term}",
                    f"The selected job lists '{term}' as required but it was not clearly detected on this resume.",
                    f"Required term gap: {term}",
                )
            )
        for term in job_keywords.get("missing_preferred_terms", [])[:3]:
            recs.append(
                _rec(
                    "Job alignment",
                    "Suggestion",
                    f"Missing preferred job term: {term}",
                    f"'{term}' is preferred for the selected job and is not clearly present.",
                    f"Preferred term gap: {term}",
                )
            )

    return recs[:20]
