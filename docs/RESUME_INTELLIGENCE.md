# Resume Intelligence & ATS Readiness

## What is Resume Health?

**Resume Health** (`resume_health_score`, 0–100) is a deterministic, explainable signal derived from the **stored parsed resume** (text + structured profile). It evaluates completeness, structure, content quality, skills, experience, projects, text-level parsing risks, and impact language.

It is **not**:

- An official ATS vendor score
- A hiring probability or guarantee that an ATS will accept your file
- A visual layout audit (fonts, columns, icons, graphics)

The parser only sees **extracted plain text** from PDF/DOCX. Visual formatting cannot be reliably inferred from text alone.

## Resume Health vs Job Match

| Signal | Purpose |
|--------|---------|
| **Resume Health** | How complete and ATS-friendly the resume text/profile appears, independent of any job |
| **Job Match (V2)** | How well the resume aligns with a **specific job description** |

When a saved job is selected on the intelligence endpoint, the API returns **both scores separately**. They are never combined into one number.

## Scoring methodology

Component subscores (0–100) are computed by dedicated analyzers under `backend/app/services/resume_intelligence/`. The overall score is a **weighted average** of available components; weights are configured in `Settings` (`resume_health_weight_*`). If a component cannot be evaluated (e.g. no experience parsed), it is omitted from the average rather than treated as perfect.

## Recommendations

Each recommendation includes category, severity, title, explanation, evidence, and a suggested improvement. Items are generated only from **detected issues** in the user's resume (or job term gaps in job-specific mode). The engine does **not** invent metrics or suggest fake percentages.

## API

`GET /api/v1/resumes/{resume_id}/intelligence`

Optional query: `job_id` (must belong to the same authenticated user).

Requires authentication and resume ownership.
