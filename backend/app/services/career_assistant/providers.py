import json
from abc import ABC, abstractmethod

import httpx

from app.config import Settings
from app.schemas import CareerReviewResponse, RewriteResponse
from app.services.career_assistant.context import CareerContext
from app.services.career_assistant.prompts import SYSTEM_FACT_SAFETY, rewrite_user_payload
from app.services.career_assistant.rewriting import rewrite_bullet, rewrite_project, rewrite_summary, skills_presentation
from app.services.career_assistant.suggestions import job_specific_review, resume_review
from app.services.career_assistant.validation import sanitize_rewrite_or_raise, normalize_job_missing_skills


class CareerAssistantProvider(ABC):
    name: str = "base"

    @abstractmethod
    def review(self, ctx: CareerContext) -> CareerReviewResponse: ...

    @abstractmethod
    def rewrite_summary(self, ctx: CareerContext) -> RewriteResponse: ...

    @abstractmethod
    def rewrite_bullet(self, ctx: CareerContext, selected_text: str) -> RewriteResponse: ...

    @abstractmethod
    def rewrite_project(self, ctx: CareerContext, selected_text: str) -> RewriteResponse: ...

    @abstractmethod
    def skills(self, ctx: CareerContext) -> RewriteResponse: ...


class DeterministicCareerAssistantProvider(CareerAssistantProvider):
    name = "deterministic"

    def review(self, ctx: CareerContext) -> CareerReviewResponse:
        if ctx.job:
            return job_specific_review(ctx)
        return resume_review(ctx)

    def rewrite_summary(self, ctx: CareerContext) -> RewriteResponse:
        return rewrite_summary(ctx)

    def rewrite_bullet(self, ctx: CareerContext, selected_text: str) -> RewriteResponse:
        return rewrite_bullet(ctx, selected_text)

    def rewrite_project(self, ctx: CareerContext, selected_text: str) -> RewriteResponse:
        return rewrite_project(ctx, selected_text)

    def skills(self, ctx: CareerContext) -> RewriteResponse:
        return skills_presentation(ctx)


class OptionalOpenAICareerAssistantProvider(CareerAssistantProvider):
    """Enhances rewrites when configured; always falls back to deterministic output on failure."""

    name = "openai_optional"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._fallback = DeterministicCareerAssistantProvider()

    def review(self, ctx: CareerContext) -> CareerReviewResponse:
        return self._fallback.review(ctx)

    def rewrite_summary(self, ctx: CareerContext) -> RewriteResponse:
        return self._maybe_llm_rewrite(ctx, "rewrite_summary", self._fallback.rewrite_summary)

    def rewrite_bullet(self, ctx: CareerContext, selected_text: str) -> RewriteResponse:
        base = self._fallback.rewrite_bullet(ctx, selected_text)
        return self._maybe_llm_rewrite(ctx, "rewrite_bullet", lambda c: base, original=selected_text, baseline=base)

    def rewrite_project(self, ctx: CareerContext, selected_text: str) -> RewriteResponse:
        base = self._fallback.rewrite_project(ctx, selected_text)
        return self._maybe_llm_rewrite(ctx, "rewrite_project", lambda c: base, original=selected_text, baseline=base)

    def skills(self, ctx: CareerContext) -> RewriteResponse:
        return self._fallback.skills(ctx)

    def _maybe_llm_rewrite(
        self,
        ctx: CareerContext,
        action: str,
        fallback_fn,
        *,
        original: str | None = None,
        baseline: RewriteResponse | None = None,
    ) -> RewriteResponse:
        if not self._settings.openai_api_key:
            return fallback_fn(ctx) if baseline is None else baseline

        base = baseline or fallback_fn(ctx)
        orig = original or base.original
        context_summary = {
            "skills": sorted(ctx.resume_skills)[:20],
            "job_title": ctx.job.title if ctx.job else None,
            "missing_required": (ctx.job_keywords or {}).get("missing_required_terms", [])[:8],
        }

        base_url = (self._settings.openai_base_url or "https://api.openai.com/v1").rstrip("/")
        headers = {"Authorization": f"Bearer {self._settings.openai_api_key}", "Content-Type": "application/json"}
        body = {
            "model": self._settings.openai_model,
            "messages": [
                {"role": "system", "content": SYSTEM_FACT_SAFETY},
                {"role": "user", "content": rewrite_user_payload(action=action, context_summary=context_summary, original=orig)},
            ],
            "temperature": 0.2,
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(f"{base_url}/chat/completions", headers=headers, json=body)
                resp.raise_for_status()
                content = resp.json()["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                rewritten = str(parsed.get("rewritten") or "").strip()
                if not rewritten:
                    return base
                safe, missing, issues = sanitize_rewrite_or_raise(
                    orig,
                    rewritten,
                    resume_skills=ctx.resume_skills,
                    job_missing_skills=normalize_job_missing_skills(ctx.job_keywords),
                )
                return RewriteResponse(
                    original=base.original,
                    rewritten=safe,
                    changes=list(parsed.get("changes") or base.changes)[:8],
                    evidence_used=list(parsed.get("evidence_used") or base.evidence_used)[:12],
                    missing_information=list(dict.fromkeys(list(parsed.get("missing_information") or []) + missing))[:8],
                    safety_notes=(base.safety_notes or []) + issues,
                    provider="openai_validated",
                )
        except Exception:
            return base


def get_career_assistant_provider(settings: Settings) -> CareerAssistantProvider:
    if settings.openai_api_key:
        return OptionalOpenAICareerAssistantProvider(settings)
    return DeterministicCareerAssistantProvider()
