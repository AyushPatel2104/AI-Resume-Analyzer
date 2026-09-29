# Production deployment guide

Target stack (zero paid tier): **Vercel** (frontend), **Render Free** (backend), **PostgreSQL-compatible** managed DB (free tier). No paid APIs required for core features.

## Architecture

```
Browser → Vercel (Next.js) → HTTPS → Render (FastAPI) → PostgreSQL
                                              ↘ ephemeral local disk (NOT durable)
```

## A. Implemented in code

- `DATABASE_URL` drives SQLAlchemy + Alembic (SQLite dev, PostgreSQL production).
- Production config validation: `DEBUG=false` requires `JWT_SECRET_KEY` (≥32 chars) and explicit `CORS_ORIGINS` (no `*`).
- Alembic-only schema changes; startup runs `alembic upgrade head`.
- Safe migration `002_applications`: skips create if table already exists (no auto-drop of data).
- Storage abstraction (`StorageProvider` / `local` backend) — swap for object storage later.
- SSRF-hardened job URL import (existing Phase 4, regression tests).
- In-memory rate limits (configurable, single-instance limitation documented).
- Security headers, request IDs, safe 500 responses when `DEBUG=false`.
- `/health` (liveness) and `/health/ready` (DB check).
- OpenAPI/docs disabled when `DEBUG=false`.
- CI: backend tests + migration test; frontend lint + build.

## B. Requires deployment environment configuration

Set on **Render** (backend):

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | `postgresql+psycopg2://...` from your DB provider |
| `JWT_SECRET_KEY` | Yes | Random ≥32 characters |
| `DEBUG` | Yes | `false` |
| `CORS_ORIGINS` | Yes | Comma-separated Vercel preview/production URLs |
| `PORT` | Auto | Render sets `PORT`; Dockerfile uses `${PORT}` |
| `STORAGE_BACKEND` | Yes | `local` only today — see storage warning |
| `UPLOAD_DIR` | Optional | Writable path on instance (ephemeral) |
| `RATE_LIMIT_*` | Optional | Tune per traffic |

Set on **Vercel** (frontend):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_API_URL` | Yes | Public HTTPS URL of Render API (no secrets) |

Optional backend: `OPENAI_API_KEY` (Career Assistant polish only).

## C. Requires live verification

- End-to-end login, upload, analyze, applications on deployed URLs.
- PostgreSQL connectivity from Render to your DB host (SSL/firewall).
- CORS preflight from Vercel origin to API.
- Confirm resume files after Render redeploy (local disk expectation).

## Storage limitation

`STORAGE_BACKEND=local` stores files on the container filesystem. **Render Free disk is not durable** — redeploys can delete uploads. The app logs a warning when `DEBUG=false` and local storage is used. Production resume persistence requires plugging a durable `StorageProvider` (S3-compatible, etc.) — not included in $0 scope.

## Database backups

No automated backups are configured in this repository. You are responsible for provider backups/snapshots on your PostgreSQL service.

## Migrations

```bash
cd backend
alembic upgrade head
```

Application startup also runs migrations. Do not use `create_all()` in production.

## Health checks

- **Liveness:** `GET /health` → `{"status":"ok"}`
- **Readiness:** `GET /health/ready` → includes database probe
- Legacy: `GET /api/v1/health`

Configure Render health check path to `/health` or `/health/ready`.

## Rate limiting

In-process token bucket per client IP and route group. Returns **429** when exceeded. Not shared across multiple instances — document if you scale horizontally.

## Security checklist

- [ ] `DEBUG=false`
- [ ] Strong `JWT_SECRET_KEY`
- [ ] Explicit `CORS_ORIGINS` (your Vercel URLs only)
- [ ] No secrets in `NEXT_PUBLIC_*`
- [ ] PostgreSQL credentials only in `DATABASE_URL` on host
- [ ] Plan for durable resume storage before relying on uploads in production

## CI

GitHub Actions workflow `.github/workflows/ci.yml` runs tests and frontend build on push/PR (no secrets required).
