# AI-Powered Resume Analyzer & Job Match System

Full-stack application that parses PDF/DOCX resumes, compares them to a job description, and returns explainable match scores, skill gaps, strengths, and recommendations.

**Repository:** [github.com/AyushPatel2104/AI-Resume-Analyzer](https://github.com/AyushPatel2104/AI-Resume-Analyzer)

---

## Current features (implemented)

- **Authentication** — register/login, JWT (Bearer + session cookie), user-scoped data
- **Resume library** — upload PDF/DOCX, parse once, reuse for analyses
- **Job library** — save jobs (manual or SSRF-hardened URL import), normalized requirements
- **Matching V2** — explainable multi-signal job match (`matcher_version: v2`); optional local semantic model or TF-IDF text similarity fallback
- **Resume Intelligence** — separate **Resume Health** / ATS-readiness signals (not the same as job match)
- **Career Assistant** — fact-safe reviews and rewrites from stored profile + match/intelligence (deterministic; optional OpenAI when configured)
- **Application Tracker** — pipeline (saved → applied → screening → interview → offer/rejected/withdrawn), notes, follow-up dates
- Analysis history and domain schema via **Alembic** (SQLite local dev; PostgreSQL via `DATABASE_URL`)
- Dashboard UI (Next.js): analyze, results, libraries, career assistant, applications
- Production hardening: CORS, rate limits, health checks, safe errors — see [docs/PRODUCTION.md](docs/PRODUCTION.md)

**Not implemented:** OCR for scanned PDFs, email/calendar integrations, application reminders/notifications, OAuth/MFA/password reset, multi-tenant workspaces, or a hosted live demo (configure and deploy when ready).

**Match scores** are explainable, request-specific signals — not a published accuracy benchmark. The marketing landing page uses **illustrative UI only** for preview widgets.

---

## Architecture

```
┌──────────────┐     REST (CORS)      ┌─────────────────────────────────┐
│  Next.js UI  │ ◄──────────────────► │  FastAPI backend                │
│  :3000       │                      │  :8000                          │
└──────────────┘                      │  parse → extract → match → save │
                                      └───────────────┬─────────────────┘
                                                      │
                                      ┌───────────────▼─────────────────┐
                                      │  SQLite / PostgreSQL            │
                                      └─────────────────────────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for pipeline details.

**Resume Intelligence (Phase 6):** [docs/RESUME_INTELLIGENCE.md](docs/RESUME_INTELLIGENCE.md) — explainable **Resume Health** (0–100) from stored parsed text, separate from **Job Match (V2)**. Not an official ATS score or hiring guarantee.

**Career Assistant (Phase 7):** [docs/CAREER_ASSISTANT.md](docs/CAREER_ASSISTANT.md) — fact-safe reviews and rewrites grounded in intelligence + match data; deterministic by default, optional OpenAI polish when configured.

**Application Tracker (Phase 8):** [docs/APPLICATION_TRACKER.md](docs/APPLICATION_TRACKER.md) — user-owned pipeline linking saved jobs and resumes to application status, notes, and follow-up dates (no reminders yet).

**Production (Phase 9):** [docs/PRODUCTION.md](docs/PRODUCTION.md) — PostgreSQL, Render/Vercel env vars, health checks, rate limits, storage limits, CI, deployment checklist.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Python 3.11+, FastAPI, Pydantic |
| Database | PostgreSQL (Docker) / SQLite (default local) |
| NLP / matching | Matching V2 (skills, text similarity, optional sentence-transformers), curated skill catalog |
| Optional AI | OpenAI-compatible chat API for recommendation polish |

---

## Project structure

```
AI Resume Analyzer/
├── backend/           # FastAPI app, services, tests
├── frontend/          # Next.js web client
├── database/          # SQL schema reference
├── docs/              # Architecture notes
├── assets/            # Static assets
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## AI / NLP pipeline

1. **Extract** plain text from PDF (`pypdf`) or DOCX (`python-docx`).
2. **Parse** sections (experience, education, skills) via heuristics; detect skills from a curated catalog.
3. **Match (V2)** — multi-signal scoring (required/preferred skills, text similarity, experience, education, projects, seniority, keywords); see [Matching V2](#matching-v2).
4. **Resume Intelligence** — separate resume health / ATS-readiness analysis on stored profiles.
5. **Recommend** — deterministic rules and Career Assistant rewrites; optional OpenAI when configured.

Scores are **relative signals** for tailoring a resume, not guaranteed hiring outcomes.

---

## Local setup

### Prerequisites

- Node.js 20+
- Python 3.11+
- (Optional) Docker Desktop for PostgreSQL stack

### 1. Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Get Started** or `/dashboard/analyze`.

> **ERR_CONNECTION_REFUSED on :3000** means the Next.js dev server is not running. Start it with `npm run dev` from `frontend/`. The API runs separately on port **8000**.

---

## Environment variables

| Variable | Where | Description | Default |
|----------|-------|-------------|---------|
| `DATABASE_URL` | backend | SQLAlchemy URL (SQLite or PostgreSQL) | `sqlite:///./data/resume_analyzer.db` |
| `CORS_ORIGINS` | backend | Comma-separated frontend origin(s) | `http://localhost:3000,...` |
| `DEBUG` | backend | When `false`, OpenAPI/Swagger docs are disabled | `false` |
| `MAX_UPLOAD_BYTES` | backend | Upload limit | `5242880` (5 MB) |
| `ALLOWED_EXTENSIONS` | backend | Resume types | `.pdf,.docx` |
| `UPLOAD_DIR` | backend | Stored uploads | `./data/uploads` |
| `OPENAI_API_KEY` | backend | Optional LLM recommendations (server only) | empty |
| `NEXT_PUBLIC_API_URL` | frontend | Public API base URL (no secrets) | `http://localhost:8000` |

---

## Database

Domain tables: `users`, `resumes`, `jobs`, `analyses`, `applications` (relational; see `database/schema.sql`). Authenticated flows set `user_id`; legacy rows with NULL `user_id` are not visible to logged-in users.

- **Local dev:** SQLite file under `backend/data/` when `DATABASE_URL` uses SQLite.
- **Schema migrations:** [Alembic](https://alembic.sqlalchemy.org/) (`backend/migrations/`). Applied on API startup via `init_db()` and manually:

```bash
cd backend
alembic upgrade head          # apply migrations
alembic downgrade base        # tear down (dev only)
alembic revision -m "message" # new revision (autogenerate optional)
```

- **PostgreSQL:** Set `DATABASE_URL=postgresql+psycopg2://...` — same Alembic migrations apply.
- **Docker Compose:** Starts PostgreSQL 16 + API (see `docker-compose.yml`).

Optional PostgreSQL smoke test (requires a running Postgres instance):

```bash
# Example after: docker compose up -d db
set POSTGRES_TEST_URL=postgresql+psycopg2://YOUR_USER:YOUR_PASSWORD@localhost:5432/resume_analyzer
pytest backend/tests/test_postgres_optional.py -q
```

---

## Authentication

Register at `/signup` or sign in at `/login`. The dashboard (`/dashboard/*`) requires a session cookie set after login.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Create account (returns JWT) |
| POST | `/api/v1/auth/login` | Sign in (returns JWT) |
| POST | `/api/v1/auth/logout` | Sign out (client discards token) |
| GET | `/api/v1/auth/me` | Current user (Bearer token or `access_token` cookie) |

Analyze endpoints require `Authorization: Bearer <token>`. User identity is taken only from the verified token — never from client-supplied `user_id`.

**Environment:** set `JWT_SECRET_KEY` (min 32 characters) when `DEBUG=false`. See `backend/.env.example`.

Legacy analyses with `user_id` NULL (pre-auth) are not visible to authenticated users.

---

## Resume library

Upload PDF/DOCX resumes once under **Dashboard → Resumes**. Each file is parsed into a structured profile (skills, experience, education, etc.) and stored for reuse.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/resumes` | Upload resume (**auth**, multipart) |
| GET | `/api/v1/resumes` | List your resumes |
| GET | `/api/v1/resumes/{id}` | Resume detail + parsed profile |
| PATCH | `/api/v1/resumes/{id}` | Rename (`name`) |
| DELETE | `/api/v1/resumes/{id}` | Delete your resume |

## Job library

Save jobs under **Dashboard → Jobs** via public URL import (SSRF-hardened) or manual entry. Normalized requirements are stored in `normalized_requirements_json`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/jobs/import/preview` | Fetch & preview URL (does not save) |
| POST | `/api/v1/jobs` | Save job (manual or confirmed import) |
| GET/PATCH/DELETE | `/api/v1/jobs/{id}` | Manage your jobs |

**Primary analyze workflow:** `POST /api/v1/analyze` with `resume_id` + `job_id` (both must belong to the authenticated user).

## Matching V2

Analysis uses an explainable multi-signal matcher (`matcher_version: v2`):

- Required/preferred skill coverage with alias normalization
- Optional local semantic embeddings (`SEMANTIC_MODEL_ENABLED=true`, requires `sentence-transformers` installed)
- TF-IDF **text similarity fallback** when semantic model is unavailable (not labeled as deep semantic AI)
- Experience, education, projects, seniority, keyword/technology signals with explicit `N/A` when data is missing
- Configurable weights via `MATCH_WEIGHT_*` environment variables (see `backend/.env.example`)
- Score is a **compatibility/match indicator**, not a hiring probability

**Legacy fallback:** `resume_id` + pasted `job_description`, or one-step resume file upload + description (creates library rows as needed).

---

## API overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check (public) |
| POST | `/api/v1/analyze` | Analyze saved resume or one-step upload (**auth required**) |
| GET | `/api/v1/analyze/history?limit=20` | Your recent analyses (**auth required**) |
| GET | `/api/v1/analyze/{id}` | Analysis detail (**auth required**, owner only) |

---

## Testing

**Backend:**

```bash
cd backend
.\.venv\Scripts\Activate.ps1   # if using venv
pytest
```

**Frontend:**

```bash
cd frontend
npm run lint
npm run build
```

---

## Production deployment requirements (not yet deployed)

This repository is **deployment-ready in configuration** but has **no public live URL** until you host it.

1. **Backend:** Set `DATABASE_URL` (managed PostgreSQL recommended), `CORS_ORIGINS` to your frontend URL(s), `UPLOAD_DIR`, `DEBUG=false`, optional `OPENAI_API_KEY`.
2. **Frontend:** Set `NEXT_PUBLIC_API_URL` to the public API origin (HTTPS).
3. **Docker Compose (local/staging):** `docker compose up --build` — override `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`, and `DATABASE_URL` via environment or `.env` file for non-localhost use.

Do not hardcode production URLs in source; configure them at deploy time.

---

## Security notes

- Do not commit API keys or database passwords (see `.gitignore`).
- `OPENAI_API_KEY` stays on the backend only — never use `NEXT_PUBLIC_` for secrets.
- Uploads are validated (type/size) and stored under `UPLOAD_DIR`; use object storage at scale.
- API docs (`/docs`) are **disabled** when `DEBUG=false`.
- Dashboard and API data require authentication; configure `JWT_SECRET_KEY` when `DEBUG=false`.

---

## Limitations

- PDFs must contain selectable text (scanned images/OCR not included).
- Profile parsing is heuristic; unusual resume layouts may parse partially.
- Skill detection uses a curated catalog plus JD token matching — niche tools may be missed unless listed in text.
- Match scores are explanatory metrics, not verified hiring predictions.

---

## Future improvements

- OCR for scanned PDFs
- Durable object storage for resume files in production (Render free tier local disk is ephemeral)
- Application reminders and email/calendar integrations
- OAuth / MFA / password reset
- Recruiter bulk upload mode

---

## Screenshots

<!-- Add screenshots of landing page, analyze flow, and results dashboard after deployment -->

---

## License

MIT — see [LICENSE](LICENSE).
