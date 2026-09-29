from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AI Resume Analyzer API"
    debug: bool = False
    api_prefix: str = "/api/v1"

    database_url: str = "sqlite:///./data/resume_analyzer.db"

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    max_upload_bytes: int = 5 * 1024 * 1024
    allowed_extensions: str = ".pdf,.docx"

    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str | None = None

    upload_dir: str = "./data/uploads"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_extension_set(self) -> set[str]:
        return {e.strip().lower() for e in self.allowed_extensions.split(",") if e.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()
