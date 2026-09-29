# Career Assistant

## Purpose

The Career Assistant turns **Resume Intelligence** and **Match V2** outputs into actionable guidance: what is weak, why it matters, and fact-safe rewrite suggestions. It does not replace stored resumes automatically.

## Architecture

```
POST /api/v1/career-assistant/*
        │
        ▼
  career_assistant/engine.py  (auth + ownership in routes)
        │
        ├── context.py      → resume, intelligence, optional job + match
        ├── suggestions.py  → reviews (deterministic)
        ├── rewriting.py    → summary/bullet/project/skills rewrites
        ├── validation.py   → anti-hallucination checks
        └── providers.py    → Deterministic + optional OpenAI (validated fallback)
```

Structured context is built from parsed profile and existing analyzers — not raw database dumps to the client.

## Supported actions

| Endpoint | Action |
|----------|--------|
| `POST /review` | Resume or job-specific review |
| `POST /rewrite-summary` | Summary rewrite from verified facts |
| `POST /rewrite-bullet` | Experience bullet rewrite |
| `POST /rewrite-project` | Project description rewrite |
| `POST /skills` | Skills grouping/presentation |
| `POST /ask` | Grounded Q&A (maps to review/rewrite intents) |

## Resume Health vs Job Match vs Career Assistant

- **Resume Health** — ATS-readiness / completeness signal (Phase 6).
- **Job Match** — Compatibility with a specific job (Match V2).
- **Career Assistant** — Explains gaps and suggests wording using those signals; never merges scores.

## Deterministic fallback

`DeterministicCareerAssistantProvider` is always available. It uses intelligence components, match gaps, and template-based rewrites.

## Optional provider

If `OPENAI_API_KEY` is set (existing config), rewrites may call the same OpenAI-compatible endpoint as match recommendations. Output is **validated** (no new metrics/skills); on failure or unsafe output, the deterministic rewrite is returned.

No new paid API dependency is required.

## Fact-safety rules

- Only use resume profile, stored text, job facts, and analysis outputs.
- Never invent employers, titles, skills, certifications, education, or metrics.
- Missing metrics → placeholders such as `[add measured improvement if available]`.
- Job-required skills absent from the resume must not appear as if the candidate has them.

## Limitations

- Not unrestricted chat; `/ask` uses intent routing.
- Does not regenerate PDF/DOCX files.
- Cannot verify unlisted experience — user must confirm all suggestions.
- Visual resume layout is not analyzed.
