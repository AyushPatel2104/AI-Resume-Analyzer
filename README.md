# AI-Powered Resume Analyzer & Job Match System

Full-stack application that parses PDF/DOCX resumes, compares them to a job description, and returns explainable match scores, skill gaps, strengths, and recommendations.

**Repository:** [github.com/AyushPatel2104/AI-Resume-Analyzer](https://github.com/AyushPatel2104/AI-Resume-Analyzer)

---

## Current features (implemented)

- Resume upload (PDF, DOCX) with size/type validation
- Text extraction and structured profile parsing (contact, skills, education, experience, projects, certifications)
- Job description analysis and resume–JD matching
- Overall match score with skill coverage and TF-IDF semantic similarity breakdown
- Matched/missing skills, strengths, weaknesses, relevant experience, recommendations
- Analysis history persisted in SQLite (local dev) or PostgreSQL (Docker/production via `DATABASE_URL`)
- Responsive marketing site and dashboard UI (Next.js)
- Optional LLM-enhanced recommendations when `OPENAI_API_KEY` is configured

**Not implemented:** user authentication, multi-tenant workspaces, OCR for scanned PDFs, or a hosted live demo (deploy when ready).

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

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Python 3.11+, FastAPI, Pydantic |
| Database | PostgreSQL (Docker) / SQLite (default local) |
| NLP / matching | scikit-learn TF-IDF, curated skill catalog, rule-based recommendations |
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
3. **Match** job description skills against resume skills; compute TF-IDF cosine similarity between full texts.
4. **Score** — if JD skills are detected: `0.55 × skill_coverage + 0.45 × semantic_similarity`; otherwise semantic similarity only.
5. **Recommend** — deterministic rules; optional OpenAI JSON recommendations when configured.

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

- **Local dev:** SQLite file created automatically under `backend/data/` when `DATABASE_URL` uses SQLite.
- **PostgreSQL:** Set `DATABASE_URL=postgresql+psycopg2://...` — tables are created on startup via SQLAlchemy (`init_db`). Reference DDL: `database/schema.sql`.
- **Docker Compose:** Starts PostgreSQL 16 + API configured for Postgres (override with env vars; see `docker-compose.yml`).

Optional PostgreSQL smoke test (requires a running Postgres instance):

```bash
# Example after: docker compose up -d db
set POSTGRES_TEST_URL=postgresql+psycopg2://YOUR_USER:YOUR_PASSWORD@localhost:5432/resume_analyzer
pytest backend/tests/test_postgres_optional.py -q
```

---

## API overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/analyze` | Multipart: `resume` file + `job_description` form field |
| GET | `/api/v1/analyze/history?limit=20` | Recent analyses |
| GET | `/api/v1/analyze/{id}` | Analysis detail |

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
- No authentication — treat as a public demo until auth is added.

---

## Limitations

- PDFs must contain selectable text (scanned images/OCR not included).
- Profile parsing is heuristic; unusual resume layouts may parse partially.
- Skill detection uses a curated catalog plus JD token matching — niche tools may be missed unless listed in text.
- Match scores are explanatory metrics, not verified hiring predictions.

---

## Future improvements

- User authentication and saved workspaces
- OCR for scanned PDFs
- Recruiter bulk upload mode
- Richer embedding-based similarity
- CI/CD and automated deployment to GitHub Pages/Vercel

---

## Screenshots

<!-- Add screenshots of landing page, analyze flow, and results dashboard after deployment -->

---

## License

MIT — see [LICENSE](LICENSE).
