from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEV_JWT_PLACEHOLDER = "dev-only-insecure-jwt-secret-do-not-use-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AI Resume Analyzer API"
    debug: bool = False
    port: int = 8000
    log_level: str = "INFO"
    api_prefix: str = "/api/v1"

    jwt_secret_key: str | None = None
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24 * 7

    database_url: str = "sqlite:///./data/resume_analyzer.db"

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    max_upload_bytes: int = 5 * 1024 * 1024
    allowed_extensions: str = ".pdf,.docx"

    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str | None = None

    upload_dir: str = "./data/uploads"
    storage_backend: str = "local"

    rate_limit_enabled: bool = True
    rate_limit_auth_per_minute: int = 20
    rate_limit_upload_per_minute: int = 15
    rate_limit_analyze_per_minute: int = 20
    rate_limit_job_import_per_minute: int = 10
    rate_limit_career_assistant_per_minute: int = 40

    max_job_description_chars: int = 100_000
    job_url_max_response_bytes: int = 2 * 1024 * 1024
    job_url_timeout_seconds: float = 10.0
    job_url_max_redirects: int = 3

    semantic_model_enabled: bool = False
    semantic_model_name: str = "all-MiniLM-L6-v2"

    match_weight_skill: float = 0.22
    match_weight_semantic: float = 0.14
    match_weight_text_similarity: float = 0.10
    match_weight_experience: float = 0.14
    match_weight_education: float = 0.08
    match_weight_project: float = 0.08
    match_weight_seniority: float = 0.06
    match_weight_required_coverage: float = 0.12
    match_weight_preferred_coverage: float = 0.04
    match_weight_keyword: float = 0.12

    resume_health_weight_completeness: float = 0.18
    resume_health_weight_structure: float = 0.14
    resume_health_weight_content: float = 0.12
    resume_health_weight_skills: float = 0.14
    resume_health_weight_experience: float = 0.16
    resume_health_weight_projects: float = 0.08
    resume_health_weight_parsing: float = 0.10
    resume_health_weight_impact: float = 0.08

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_extension_set(self) -> set[str]:
        return {e.strip().lower() for e in self.allowed_extensions.split(",") if e.strip()}

    @property
    def jwt_secret(self) -> str:
        if self.jwt_secret_key:
            return self.jwt_secret_key
        if self.debug:
            return _DEV_JWT_PLACEHOLDER
        raise RuntimeError("JWT_SECRET_KEY is required when DEBUG=false")

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def is_postgres(self) -> bool:
        return self.database_url.startswith("postgresql")

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.debug:
            return self
        secret = self.jwt_secret_key
        if not secret or len(secret) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters when DEBUG=false")
        if "*" in self.cors_origin_list:
            raise ValueError("CORS_ORIGINS must not include '*' when DEBUG=false")
        if not self.cors_origin_list:
            raise ValueError("CORS_ORIGINS must list at least one frontend origin when DEBUG=false")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
