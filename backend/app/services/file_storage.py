import uuid
from pathlib import Path

from app.config import Settings


class LocalFileStorage:
    """Local filesystem storage — not durable on ephemeral hosts (Render free tier)."""

    def save_bytes(self, settings: Settings, data: bytes, original_filename: str) -> str | None:
        if ".." in original_filename or "/" in original_filename or "\\" in original_filename:
            return None
        safe_filename = Path(original_filename).name
        if not safe_filename or safe_filename in {".", ".."}:
            return None

        upload_dir = Path(settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)
        upload_root = upload_dir.resolve()
        file_id = str(uuid.uuid4())
        dest_path = (upload_root / f"{file_id}_{safe_filename}").resolve()
        try:
            dest_path.relative_to(upload_root)
        except ValueError:
            return None
        try:
            dest_path.write_bytes(data)
        except OSError:
            return None
        return str(dest_path)

    def delete(self, stored_path: str | None) -> None:
        if not stored_path:
            return
        try:
            path = Path(stored_path)
            if path.is_file():
                path.unlink()
        except OSError:
            return


local_file_storage = LocalFileStorage()  # backward-compatible alias for tests/imports
