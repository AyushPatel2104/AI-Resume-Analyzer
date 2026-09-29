import io
import uuid

import pytest
from docx import Document
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import Settings, get_settings
from app.database import init_db
from app.main import app
from app.services.file_storage import LocalFileStorage

client = TestClient(app)


def test_jwt_secret_required_when_debug_false():
    with pytest.raises(ValidationError):
        Settings(debug=False, jwt_secret_key=None, cors_origins="https://app.example.com")


def test_cors_wildcard_rejected_in_production():
    with pytest.raises(ValidationError):
        Settings(debug=False, jwt_secret_key="x" * 32, cors_origins="*")


def test_production_settings_accepts_explicit_origins():
    s = Settings(debug=False, jwt_secret_key="x" * 32, cors_origins="https://app.example.com")
    assert "https://app.example.com" in s.cors_origin_list


def test_liveness_health():
    init_db()
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_readiness_health():
    init_db()
    response = client.get("/health/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["database"] == "ok"


def test_security_headers_present():
    init_db()
    response = client.get("/health")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"


def test_path_traversal_filename_blocked():
    storage = LocalFileStorage()
    settings = get_settings()
    path = storage.save_bytes(settings, b"data", "../../etc/passwd")
    assert path is None


def test_upload_size_limit_enforced():
    init_db()
    email = f"up-{uuid.uuid4().hex[:8]}@example.com"
    token = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Secret123", "full_name": "U"},
    ).json()["access_token"]
    doc = Document()
    doc.add_paragraph("Python FastAPI")
    buf = io.BytesIO()
    doc.save(buf)
    data = buf.getvalue()
    settings = get_settings()
    huge = data + b"0" * (settings.max_upload_bytes + 1)
    files = {
        "resume": (
            "big.docx",
            huge,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    }
    response = client.post(
        "/api/v1/resumes",
        headers={"Authorization": f"Bearer {token}"},
        files=files,
    )
    assert response.status_code in {400, 413, 422}


def test_rate_limit_auth(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    get_settings.cache_clear()
    from app.main import create_app

    limited = TestClient(create_app())
    email = f"rl-{uuid.uuid4().hex[:8]}@example.com"
    last_status = 200
    for _ in range(25):
        last_status = limited.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "wrong"},
        ).status_code
        if last_status == 429:
            break
    get_settings.cache_clear()
    assert last_status == 429


def test_ssrf_localhost_blocked():
    init_db()
    email = f"ssrf-{uuid.uuid4().hex[:8]}@example.com"
    token = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Secret123"},
    ).json()["access_token"]
    response = client.post(
        "/api/v1/jobs/import/preview",
        headers={"Authorization": f"Bearer {token}"},
        json={"url": "http://127.0.0.1/job"},
    )
    assert response.status_code in {400, 422}
