from dataclasses import dataclass

from app.config import Settings


@dataclass
class HealthScore:
    overall: float
    weights_used: dict[str, float]


def weighted_health(components: dict[str, float | None], settings: Settings) -> HealthScore:
    weights = {
        "completeness": settings.resume_health_weight_completeness,
        "structure": settings.resume_health_weight_structure,
        "content_quality": settings.resume_health_weight_content,
        "skills_quality": settings.resume_health_weight_skills,
        "experience_quality": settings.resume_health_weight_experience,
        "project_quality": settings.resume_health_weight_projects,
        "parsing_readiness": settings.resume_health_weight_parsing,
        "impact_signals": settings.resume_health_weight_impact,
    }
    active = {k: weights[k] for k, v in components.items() if v is not None and k in weights}
    if not active:
        return HealthScore(overall=0.0, weights_used={})
    total = sum(active.values())
    score = sum((active[k] / total) * float(components[k]) for k in active)
    return HealthScore(overall=round(max(0.0, min(100.0, score)), 1), weights_used={k: round(active[k] / total, 4) for k in active})


def completeness_score(section_status: dict[str, dict]) -> float:
    required = ["contact", "skills", "experience"]
    optional_boost = ["summary", "education", "projects", "certifications"]
    base = 0.0
    for key in required:
        st = section_status.get(key, {})
        if st.get("strength") == "strong":
            base += 25.0
        elif st.get("detected"):
            base += 15.0
    for key in optional_boost:
        st = section_status.get(key, {})
        if st.get("strength") in {"strong", "partial"}:
            base += 6.0
    return round(min(100.0, base), 1)


def structure_score(section_status: dict[str, dict], parsing_risks: list[dict]) -> float:
    detected_count = sum(1 for s in section_status.values() if s.get("detected"))
    score = min(100.0, detected_count * 12.0)
    likely_risks = sum(1 for r in parsing_risks if r.get("level") in {"likely", "detected"} and "No major" not in r.get("title", ""))
    score -= likely_risks * 8.0
    return round(max(20.0, min(100.0, score)), 1)
