import re

from app.schemas import RewriteResponse
from app.services.career_assistant.context import CareerContext
from app.services.career_assistant.validation import (
    catalog_skills_in_text,
    find_new_measurable_claims,
    measurable_tokens,
    normalize_job_missing_skills,
    sanitize_rewrite_or_raise,
)
from app.services.matching.skill_normalization import resume_skill_set

_ACTION_VERBS = ("Built", "Delivered", "Implemented", "Designed", "Led", "Created", "Optimized", "Automated")
_GENERIC_OPENERS = (
    "responsible for",
    "duties included",
    "worked on",
    "helped with",
)


def _rewrite_result(
    original: str,
    rewritten: str,
    changes: list[str],
    evidence: list[str],
    missing: list[str],
    notes: list[str] | None = None,
) -> RewriteResponse:
    return RewriteResponse(
        original=original,
        rewritten=rewritten,
        changes=changes,
        evidence_used=evidence,
        missing_information=missing,
        safety_notes=notes or [],
    )


def rewrite_summary(ctx: CareerContext) -> RewriteResponse:
    profile = ctx.profile
    original = (profile.summary or "").strip()
    if not original and profile.experience:
        original = " ".join(
            filter(
                None,
                [
                    profile.experience[0].title,
                    profile.experience[0].company,
                    (profile.experience[0].description or "")[:120],
                ],
            )
        ).strip()

    skills = sorted(resume_skill_set(profile.skills, profile.technologies, ctx.resume_text))[:6]
    evidence = [s.title() for s in skills]
    if profile.name:
        evidence.append(profile.name)
    for exp in profile.experience[:2]:
        if exp.title:
            evidence.append(exp.title)
        if exp.company:
            evidence.append(exp.company)

    role_hint = ""
    if profile.experience and profile.experience[0].title:
        role_hint = profile.experience[0].title

    skill_clause = ", ".join(s.title() for s in skills[:5]) if skills else "core technologies from your experience"
    parts = []
    if role_hint:
        parts.append(f"{role_hint} with hands-on experience across {skill_clause}.")
    else:
        parts.append(f"Professional focused on {skill_clause}.")

    if profile.experience:
        exp = profile.experience[0]
        if exp.description:
            snippet = re.sub(r"\s+", " ", exp.description.strip())[:140]
            parts.append(snippet.rstrip(".") + ".")
        elif exp.company:
            parts.append(f"Recent work at {exp.company}.")

    if ctx.job and ctx.job_keywords:
        matched = ctx.job_keywords.get("matched_required_terms") or []
        for term in matched[:2]:
            if term.lower() not in " ".join(parts).lower():
                parts.append(f"Experience aligns with {term} requirements for {ctx.job.title}.")

    rewritten = " ".join(parts).strip()
    missing: list[str] = []
    if not measurable_tokens(original) and not measurable_tokens(rewritten):
        missing.append("No measurable performance result found — add one only if accurate.")

    rewritten, extra_missing, issues = sanitize_rewrite_or_raise(
        original or rewritten,
        rewritten,
        resume_skills=ctx.resume_skills,
        job_missing_skills=normalize_job_missing_skills(ctx.job_keywords),
    )
    missing.extend(extra_missing)

    changes = [
        "Structured summary around verified skills and roles from your profile.",
        "Used action-oriented phrasing without inventing employers or metrics.",
    ]
    if ctx.job:
        changes.append("Aligned wording with matched job terminology where evidence exists.")

    return _rewrite_result(
        original or "(no summary extracted)",
        rewritten,
        changes,
        list(dict.fromkeys(evidence))[:10],
        list(dict.fromkeys(missing)),
        issues,
    )


def _improve_bullet_text(original: str, ctx: CareerContext) -> tuple[str, list[str], list[str], list[str]]:
    text = original.strip()
    lower = text.lower()
    changes: list[str] = []
    evidence = [s.title() for s in sorted(catalog_skills_in_text(text) & ctx.resume_skills)]

    rewritten = text
    for opener in _GENERIC_OPENERS:
        if opener in lower:
            rewritten = re.sub(re.escape(opener), "Delivered", rewritten, count=1, flags=re.I)
            changes.append(f"Replaced generic opener '{opener}' with stronger action language.")
            break

    if not re.search(r"\b(built|delivered|implemented|designed|led|created|improved)\b", rewritten, re.I):
        verb = _ACTION_VERBS[0]
        rewritten = f"{verb} {rewritten[0].lower() + rewritten[1:] if rewritten else rewritten}"
        changes.append("Added action-oriented verb using existing bullet content.")

    techs = sorted(catalog_skills_in_text(text) & ctx.resume_skills)
    if techs and not any(t in rewritten.lower() for t in techs):
        rewritten = f"{rewritten.rstrip('.')}, using {', '.join(t.title() for t in techs[:3])}."
        changes.append("Surfaced technologies already mentioned in the bullet.")

    if not measurable_tokens(text):
        if "[add measured" not in rewritten.lower():
            rewritten = rewritten.rstrip(".") + " [add measured improvement if available]."
            changes.append("Flagged placeholder for metrics instead of inventing a number.")

    if ctx.job and ctx.job_keywords:
        matched = [t for t in (ctx.job_keywords.get("matched_required_terms") or []) if t.lower() in text.lower()]
        for term in matched[:1]:
            changes.append(f"Preserved job-relevant term already in bullet: {term}.")

    missing: list[str] = []
    if not measurable_tokens(text):
        missing.append("No measurable performance result found in original bullet.")

    rewritten, extra_missing, _ = sanitize_rewrite_or_raise(
        text,
        rewritten,
        resume_skills=ctx.resume_skills,
        job_missing_skills=normalize_job_missing_skills(ctx.job_keywords),
    )
    missing.extend(extra_missing)

    if find_new_measurable_claims(text, rewritten):
        missing.append("Removed invented metrics — use placeholders only.")

    return rewritten, changes, list(dict.fromkeys(evidence))[:8], missing


def rewrite_bullet(ctx: CareerContext, selected_text: str) -> RewriteResponse:
    original = selected_text.strip()
    rewritten, changes, evidence, missing = _improve_bullet_text(original, ctx)
    return _rewrite_result(original, rewritten, changes or ["Clarified wording using existing facts."], evidence, missing)


def rewrite_project(ctx: CareerContext, selected_text: str) -> RewriteResponse:
    original = selected_text.strip()
    rewritten, changes, evidence, missing = _improve_bullet_text(original, ctx)
    if "project" not in " ".join(changes).lower():
        changes.append("Framed project description with outcome-oriented language from existing text.")
    return _rewrite_result(original, rewritten, changes, evidence, missing)


def skills_presentation(ctx: CareerContext) -> RewriteResponse:
    profile = ctx.profile
    original = ", ".join(profile.skills + profile.technologies) or "(no skills section extracted)"
    skills = sorted(ctx.resume_skills)
    groups: dict[str, list[str]] = {
        "Languages": [],
        "Frameworks & libraries": [],
        "Data & storage": [],
        "Cloud & DevOps": [],
        "Other": [],
    }
    lang = {"python", "javascript", "typescript", "java", "go", "rust", "ruby", "php", "c++", "c#", "sql", "r"}
    fw = {"react", "next.js", "vue", "angular", "fastapi", "django", "flask", "node.js", "spring", "express", ".net"}
    data = {"postgresql", "mysql", "mongodb", "redis", "kafka", "spark", "pandas", "numpy"}
    cloud = {"aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd"}

    for skill in skills:
        if skill in lang:
            groups["Languages"].append(skill.title())
        elif skill in fw:
            groups["Frameworks & libraries"].append(skill.title())
        elif skill in data:
            groups["Data & storage"].append(skill.title())
        elif skill in cloud:
            groups["Cloud & DevOps"].append(skill.title())
        else:
            groups["Other"].append(skill.title())

    lines = []
    for label, items in groups.items():
        if items:
            lines.append(f"{label}: {', '.join(items)}")

    rewritten = "\n".join(lines) if lines else original
    missing_in_section = ctx.intelligence.skills_quality.get("missing_in_skills_section") or []
    missing = []
    if missing_in_section:
        missing.append(
            "These appear elsewhere on the resume but not in skills: "
            + ", ".join(missing_in_section[:6])
            + " — add only if accurate."
        )

    changes = [
        "Grouped existing skills by category for readability.",
        "Did not add skills that are not evidenced on the resume.",
    ]
    if ctx.job and ctx.job_keywords:
        for term in ctx.job_keywords.get("missing_required_terms", [])[:3]:
            missing.append(f"Missing job requirement: {term} — only add if you actually have experience.")

    return _rewrite_result(
        original,
        rewritten,
        changes,
        [s.title() for s in skills[:15]],
        missing,
        ["Do not claim skills listed only as job gaps unless they are true for you."],
    )
