# Application Tracker

## Data model

`applications` table links an authenticated **user** to an existing **job** and **resume** (foreign keys, no duplicated job/resume payloads).

| Field | Purpose |
|-------|---------|
| `status` | Pipeline stage (controlled enum) |
| `applied_at` | When the user applied (optional) |
| `follow_up_date` | Optional reminder date (display only in this phase) |
| `notes` | Private user notes |
| `source` | Optional channel (LinkedIn, referral, etc.) |

Unique constraint: `(user_id, job_id, resume_id)` prevents duplicate trackers for the same pairing.

## Statuses

`SAVED`, `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `REJECTED`, `WITHDRAWN`

Default on create: **SAVED** (not auto-marked as applied).

Users may move between any valid statuses; unknown values are rejected at the API.

## API

| Method | Path |
|--------|------|
| POST | `/api/v1/applications` |
| GET | `/api/v1/applications` (filters: status, job_id, resume_id, search; sort) |
| GET | `/api/v1/applications/{id}` |
| PATCH | `/api/v1/applications/{id}` |
| DELETE | `/api/v1/applications/{id}` |

List responses include factual **statistics** (counts by status, upcoming follow-ups). No hiring probability or predictive scores.

## Ownership

All routes require authentication. The backend resolves ownership via JWT user id only. Cross-user access returns **404**.

## Match & Resume Health linkage

- **Job Match** on list/detail: latest **stored** `analyses` row for the resume+job pair (no Match V2 recalculation on list).
- **Resume Health** on **detail only**: computed from stored resume via Resume Intelligence (not persisted on the application).
- If no analysis exists, match fields are null — scores are never invented.

## Deferred

- Email / calendar integrations  
- Reminders and push notifications  
- Application document export  

## Migration

Alembic revision `002_applications` creates the table and unique constraint. Use `alembic upgrade head` (via app startup `init_db()` in development).
