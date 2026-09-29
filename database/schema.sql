-- PostgreSQL schema (mirrors SQLAlchemy models; tables are auto-created on startup for dev)

CREATE TABLE IF NOT EXISTS analyses (
    id VARCHAR(36) PRIMARY KEY,
    original_filename VARCHAR(512) NOT NULL,
    file_path VARCHAR(1024),
    resume_text TEXT NOT NULL,
    job_description TEXT NOT NULL,
    parsed_profile_json TEXT NOT NULL,
    match_result_json TEXT NOT NULL,
    overall_score DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses (created_at DESC);
