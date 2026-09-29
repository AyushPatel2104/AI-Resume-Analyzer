from fastapi import HTTPException

from app.config import Settings
from app.models import Job, Resume
from app.schemas import CareerAskResponse, CareerReviewResponse, RewriteResponse
from app.services.career_assistant.context import build_career_context
from app.services.career_assistant.providers import get_career_assistant_provider
from app.services.career_assistant.validation import clamp_selected_text, profile_text_blobs, text_belongs_to_resume


def run_review(resume: Resume, settings: Settings, job: Job | None = None) -> CareerReviewResponse:
    ctx = build_career_context(resume, settings, job=job)
    provider = get_career_assistant_provider(settings)
    result = provider.review(ctx)
    result.provider = provider.name
    return result


def run_rewrite_summary(resume: Resume, settings: Settings, job: Job | None = None) -> RewriteResponse:
    ctx = build_career_context(resume, settings, job=job)
    result = get_career_assistant_provider(settings).rewrite_summary(ctx)
    if not result.provider:
        result.provider = get_career_assistant_provider(settings).name
    return result


def run_rewrite_bullet(
    resume: Resume,
    settings: Settings,
    selected_text: str,
    job: Job | None = None,
) -> RewriteResponse:
    text = clamp_selected_text(selected_text)
    ctx = build_career_context(resume, settings, job=job)
    blobs = profile_text_blobs(ctx.profile) + [ctx.resume_text]
    if not text_belongs_to_resume(text, ctx.resume_text, blobs):
        raise HTTPException(
            status_code=422,
            detail="Selected text must match content from your stored resume.",
        )
    provider = get_career_assistant_provider(settings)
    result = provider.rewrite_bullet(ctx, text)
    result.provider = provider.name
    return result


def run_rewrite_project(
    resume: Resume,
    settings: Settings,
    selected_text: str,
    job: Job | None = None,
) -> RewriteResponse:
    text = clamp_selected_text(selected_text)
    ctx = build_career_context(resume, settings, job=job)
    project_blobs = list(ctx.profile.projects) + [ctx.resume_text]
    if not text_belongs_to_resume(text, ctx.resume_text, project_blobs):
        raise HTTPException(
            status_code=422,
            detail="Selected project text must match content from your stored resume.",
        )
    provider = get_career_assistant_provider(settings)
    result = provider.rewrite_project(ctx, text)
    result.provider = provider.name
    return result


def run_skills(resume: Resume, settings: Settings, job: Job | None = None) -> RewriteResponse:
    ctx = build_career_context(resume, settings, job=job)
    provider = get_career_assistant_provider(settings)
    result = provider.skills(ctx)
    result.provider = provider.name
    return result


def run_ask(resume: Resume, settings: Settings, message: str, job: Job | None = None) -> CareerAskResponse:
    """Grounded Q&A — maps to structured review, not open-ended chat."""
    msg = (message or "").strip()[:2000]
    if not msg:
        raise HTTPException(status_code=422, detail="Message is required.")

    lower = msg.lower()
    ctx = build_career_context(resume, settings, job=job)
    provider = get_career_assistant_provider(settings)

    if any(k in lower for k in ("summary", "profile", "about me")) and any(
        k in lower for k in ("improve", "rewrite", "help", "better")
    ):
        rewrite = provider.rewrite_summary(ctx)
        return CareerAskResponse(
            intent="rewrite_summary",
            answer="Here is a fact-safe summary revision based on your stored profile.",
            rewrite=rewrite,
            provider=provider.name,
        )

    if "project" in lower and any(k in lower for k in ("improve", "rewrite", "help")):
        if not ctx.profile.projects:
            return CareerAskResponse(
                intent="rewrite_project",
                answer="No project entries were parsed from your resume to rewrite.",
                provider=provider.name,
            )
        rewrite = provider.rewrite_project(ctx, ctx.profile.projects[0])
        return CareerAskResponse(
            intent="rewrite_project",
            answer="Suggested revision for your first parsed project entry (verify before use).",
            rewrite=rewrite,
            provider=provider.name,
        )

    if any(k in lower for k in ("not matching", "why", "gap", "match", "missing")):
        rev = provider.review(ctx)
        score = ctx.match.overall_score if ctx.match else None
        parts = [
            f"Job Match score: {score}/100." if score is not None else "Select a saved job for match details.",
        ]
        if ctx.match and ctx.match.missing_required_skills:
            parts.append("Missing required skills: " + ", ".join(ctx.match.missing_required_skills[:8]) + ".")
        if ctx.intelligence.recommendations:
            parts.append(ctx.intelligence.recommendations[0].explanation)
        return CareerAskResponse(
            intent="job_match_explanation",
            answer=" ".join(parts),
            review=rev,
            provider=provider.name,
        )

    rev = provider.review(ctx)
    return CareerAskResponse(
        intent="resume_review",
        answer="Summary of strengths, gaps, and priority improvements from your resume intelligence analysis.",
        review=rev,
        provider=provider.name,
    )
