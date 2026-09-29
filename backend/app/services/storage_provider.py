from typing import Protocol

from app.config import Settings


class StorageProvider(Protocol):
    """Provider-agnostic object storage (local disk in dev; plug S3-compatible in production)."""

    def save_bytes(self, settings: Settings, data: bytes, original_filename: str) -> str | None: ...

    def delete(self, stored_path: str | None) -> None: ...


def get_storage_provider(settings: Settings) -> StorageProvider:
    backend = (settings.storage_backend or "local").strip().lower()
    if backend == "local":
        from app.services.file_storage import LocalFileStorage

        return LocalFileStorage()
    raise RuntimeError(
        f"Unsupported STORAGE_BACKEND={backend!r}. Use 'local' for development. "
        "Production resume files require durable object storage — see docs/PRODUCTION.md."
    )
