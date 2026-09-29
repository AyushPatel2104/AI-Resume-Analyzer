-- Reference schema for PostgreSQL (authoritative changes: Alembic migrations in backend/alembic/versions/)
--
-- Temporary nullable ownership (until authentication):
--   users are not required yet; resumes.user_id, jobs.user_id, analyses.user_id may be NULL.

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resumes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users (id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(512) NOT NULL,
    file_type VARCHAR(16) NOT NULL,
    file_size INTEGER NOT NULL,
    stored_path VARCHAR(1024),
    resume_text TEXT NOT NULL,
    parsed_profile_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_resumes_user_id ON resumes (user_id);
CREATE INDEX IF NOT EXISTS ix_resumes_user_id_created_at ON resumes (user_id, created_at);

CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users (id) ON DELETE SET NULL,
    title VARCHAR(512) NOT NULL,
    company_name VARCHAR(512),
    source_url VARCHAR(2048),
    job_description TEXT NOT NULL,
    normalized_requirements_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_jobs_user_id ON jobs (user_id);
CREATE INDEX IF NOT EXISTS ix_jobs_user_id_created_at ON jobs (user_id, created_at);

CREATE TABLE IF NOT EXISTS analyses (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users (id) ON DELETE SET NULL,
    resume_id VARCHAR(36) NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
    job_id VARCHAR(36) NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
    overall_score DOUBLE PRECISION NOT NULL,
    match_result_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_analyses_user_id ON analyses (user_id);
CREATE INDEX IF NOT EXISTS ix_analyses_resume_id ON analyses (resume_id);
CREATE INDEX IF NOT EXISTS ix_analyses_job_id ON analyses (job_id);
CREATE INDEX IF NOT EXISTS ix_analyses_user_id_created_at ON analyses (user_id, created_at);
CREATE INDEX IF NOT EXISTS ix_analyses_created_at ON analyses (created_at);
