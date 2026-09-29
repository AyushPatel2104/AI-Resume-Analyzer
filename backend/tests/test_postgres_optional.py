import os

import pytest
from sqlalchemy import create_engine, text

pytestmark = pytest.mark.skipif(
    not os.getenv("POSTGRES_TEST_URL"),
    reason="Set POSTGRES_TEST_URL to run PostgreSQL smoke test (e.g. docker compose up db).",
)


def test_postgres_connect_and_create_tables():
    url = os.environ["POSTGRES_TEST_URL"]
    engine = create_engine(url, pool_pre_ping=True)
    with engine.connect() as conn:
        assert conn.execute(text("SELECT 1")).scalar() == 1

    from app.database import Base
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
