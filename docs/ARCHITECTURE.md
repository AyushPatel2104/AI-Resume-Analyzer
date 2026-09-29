# Architecture

## Overview

- **Frontend** (`frontend/`): Next.js App Router UI — marketing site, analyze workflow, results dashboard.
- **Backend** (`backend/`): FastAPI REST API — upload parsing, profile extraction, matching, persistence.
- **Database**: PostgreSQL in production/Docker; SQLite default for local development.

## Analysis pipeline

1. **Upload validation** — extension whitelist (`.pdf`, `.docx`), size limit, non-empty payload.
2. **Text extraction** — `pypdf` for PDF, `python-docx` for DOCX.
3. **Structured extraction** — section heuristics, regex contact fields, catalog-based skill detection.
4. **Matching**
   - Job-description skill tokens from a curated catalog.
   - Skill coverage = matched ÷ required (when JD skills exist).
   - Semantic similarity = TF-IDF cosine similarity between resume and JD.
   - Overall score = weighted blend (55% coverage + 45% semantic when JD skills exist; semantic-only otherwise).
5. **Recommendations** — rule-based defaults; optional OpenAI enhancement when `OPENAI_API_KEY` is set.
6. **Persistence** — analysis JSON stored in `analyses` table for history and detail views.

## Security notes

- Secrets via environment variables only.
- Uploads stored on server filesystem under `UPLOAD_DIR` (configurable).
- CORS restricted to configured origins.
- No authentication in v1 (single-user/demo workspace); add auth before multi-tenant production use.
