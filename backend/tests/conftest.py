import os
import sys
from pathlib import Path

os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-at-least-32-chars!!")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import get_settings

get_settings.cache_clear()
