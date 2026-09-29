from __future__ import annotations

import hashlib
from functools import lru_cache
from typing import TYPE_CHECKING

from app.services.matching.text_similarity import tfidf_cosine_similarity

if TYPE_CHECKING:
    from app.config import Settings

_embedding_cache: dict[str, tuple[float, float]] = {}


def _cache_key(resume_text: str, job_description: str) -> str:
    digest = hashlib.sha256((resume_text + "\n---\n" + job_description).encode("utf-8", errors="ignore")).hexdigest()
    return digest


@lru_cache(maxsize=1)
def _load_sentence_model(model_name: str):
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(model_name)


def compute_semantic_signal(
    resume_text: str,
    job_description: str,
    settings: Settings,
) -> tuple[float | None, float, str]:
    """
    Returns (semantic_score_0_100_or_none, text_similarity_0_100, method_label).
    Semantic score is only set when an embedding model is enabled and available.
    """
    cache_key = _cache_key(resume_text, job_description)
    if cache_key in _embedding_cache:
        return _embedding_cache[cache_key]

    text_sim = round(tfidf_cosine_similarity(resume_text, job_description) * 100.0, 1)
    semantic_score: float | None = None
    method = "text_similarity_only"

    if settings.semantic_model_enabled:
        try:
            model = _load_sentence_model(settings.semantic_model_name)
            embeddings = model.encode([resume_text[:8000], job_description[:8000]], normalize_embeddings=True)
            import numpy as np

            sim = float(np.clip(float(np.dot(embeddings[0], embeddings[1])), 0.0, 1.0))
            semantic_score = round(sim * 100.0, 1)
            method = "sentence_transformer"
        except Exception:
            semantic_score = None
            method = "text_similarity_only"

    result = (semantic_score, text_sim, method)
    _embedding_cache[cache_key] = result
    return result
