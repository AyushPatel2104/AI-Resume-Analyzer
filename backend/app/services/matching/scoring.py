from dataclasses import dataclass
from typing import Any

from app.config import Settings


@dataclass
class WeightedScore:
    overall: float
    weights_used: dict[str, float]


def weighted_overall(components: dict[str, float | None], settings: Settings) -> WeightedScore:
    weight_map = {
        "skill": settings.match_weight_skill,
        "semantic": settings.match_weight_semantic,
        "text_similarity": settings.match_weight_text_similarity,
        "experience": settings.match_weight_experience,
        "education": settings.match_weight_education,
        "project": settings.match_weight_project,
        "seniority": settings.match_weight_seniority,
        "required_coverage": settings.match_weight_required_coverage,
        "preferred_coverage": settings.match_weight_preferred_coverage,
        "keyword": settings.match_weight_keyword,
    }

    active: dict[str, float] = {}
    for key, weight in weight_map.items():
        value = components.get(key)
        if value is None:
            continue
        active[key] = weight

    if not active:
        return WeightedScore(overall=0.0, weights_used={})

    total_weight = sum(active.values())
    score = 0.0
    normalized_weights: dict[str, float] = {}
    for key, weight in active.items():
        norm_w = weight / total_weight
        normalized_weights[key] = round(norm_w, 4)
        score += norm_w * float(components[key])

    return WeightedScore(overall=round(max(0.0, min(100.0, score)), 1), weights_used=normalized_weights)
