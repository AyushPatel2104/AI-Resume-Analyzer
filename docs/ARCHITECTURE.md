# Architecture

## Overview

- **Frontend** (`frontend/`): Next.js App Router UI — marketing site, analyze workflow, results dashboard.
- **Backend** (`backend/`): FastAPI REST API — upload parsing, profile extraction, matching, persistence.
- **Database**: PostgreSQL in production/Docker; SQLite default for local development.

## Analysis pipeline

1. **Upload validation** — extension whitelist (`.pdf`, `.docx`), size limit, non-empty payload.
2. **Text extraction** — `pypdf` for PDF, `python-docx` for DOCX.
3. **Structured extraction** — section heuristics, regex contact fields, catalog-based skill detection.
4. **Matching (V2)**
   - Multi-signal engine under `backend/app/services/matching/` (skills, optional local embeddings, TF-IDF text fallback, experience, education, projects, seniority, requirement/keyword coverage).
   - Uses Phase 4 `normalized_requirements_json` when analyzing saved jobs.
   - Weights are configurable via settings/env; missing signals are excluded from weighting (not treated as perfect).
   - V1 TF-IDF matcher remains in `matcher.py` for regression tests.
5. **Recommendations** — rule-based defaults; optional OpenAI enhancement when `OPENAI_API_KEY` is set.
6. **Persistence** — users maintain **resume** and **job** libraries; analyses link an owned `resume_id` and `job_id`. Job URL import uses SSRF-validated HTTP fetch + HTML extraction + deterministic requirement normalization (not semantic AI matching). Schema changes use Alembic (`backend/migrations/`). Ownership enforced via JWT on all library and analyze routes.

## Security notes

- Secrets via environment variables only (`JWT_SECRET_KEY` required when `DEBUG=false`).
- Passwords hashed with bcrypt; JWT access tokens (HS256) for API auth.
- Uploads stored on server filesystem under `UPLOAD_DIR` (configurable).
- CORS restricted to configured origins (`allow_credentials` for cookie/Bearer clients).
- Analyze/history/detail routes enforce ownership via `user_id` from the verified JWT only.
