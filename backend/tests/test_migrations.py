from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

ROOT = Path(__file__).resolve().parents[1]


def test_alembic_upgrade_and_downgrade_roundtrip(tmp_path):
    db_path = tmp_path / "migration_test.db"
    url = f"sqlite:///{db_path.as_posix()}"
    cfg = Config(str(ROOT / "alembic.ini"))
    cfg.set_main_option("sqlalchemy.url", url)

    command.upgrade(cfg, "head")
    command.upgrade(cfg, "head")
    engine = create_engine(url, connect_args={"check_same_thread": False})
    inspector = inspect(engine)
    for table in ("users", "resumes", "jobs", "analyses", "applications"):
        assert inspector.has_table(table)

    analysis_cols = {c["name"] for c in inspector.get_columns("analyses")}
    assert {"resume_id", "job_id", "overall_score", "match_result_json"} <= analysis_cols
    assert "original_filename" not in analysis_cols

    command.downgrade(cfg, "base")
    inspector = inspect(engine)
    for table in ("users", "resumes", "jobs", "analyses", "applications"):
        assert not inspector.has_table(table)
