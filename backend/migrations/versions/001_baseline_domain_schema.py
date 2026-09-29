"""Baseline domain schema with users, resumes, jobs, and relational analyses.

Revision ID: 001_baseline_domain
Revises:
Create Date: 2026-03-29

"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect, text

revision: str = "001_baseline_domain"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _bool_default():
    return sa.text("1")


def _create_users() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=_bool_default()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)


def _create_resumes() -> None:
    op.create_table(
        "resumes",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("original_filename", sa.String(length=512), nullable=False),
        sa.Column("file_type", sa.String(length=16), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("stored_path", sa.String(length=1024), nullable=True),
        sa.Column("resume_text", sa.Text(), nullable=False),
        sa.Column("parsed_profile_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.create_index("ix_resumes_user_id", "resumes", ["user_id"], unique=False)
    op.create_index("ix_resumes_user_id_created_at", "resumes", ["user_id", "created_at"], unique=False)


def _create_jobs() -> None:
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("company_name", sa.String(length=512), nullable=True),
        sa.Column("source_url", sa.String(length=2048), nullable=True),
        sa.Column("job_description", sa.Text(), nullable=False),
        sa.Column("normalized_requirements_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.create_index("ix_jobs_user_id", "jobs", ["user_id"], unique=False)
    op.create_index("ix_jobs_user_id_created_at", "jobs", ["user_id", "created_at"], unique=False)


def _create_analyses() -> None:
    op.create_table(
        "analyses",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("resume_id", sa.String(length=36), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.String(length=36), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("overall_score", sa.Float(), nullable=False),
        sa.Column("match_result_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.create_index("ix_analyses_user_id", "analyses", ["user_id"], unique=False)
    op.create_index("ix_analyses_resume_id", "analyses", ["resume_id"], unique=False)
    op.create_index("ix_analyses_job_id", "analyses", ["job_id"], unique=False)
    op.create_index("ix_analyses_user_id_created_at", "analyses", ["user_id", "created_at"], unique=False)
    op.create_index("ix_analyses_created_at", "analyses", ["created_at"], unique=False)


def _job_title_from_description(job_description: str) -> str:
    first_line = next((ln.strip() for ln in job_description.splitlines() if ln.strip()), "")
    return (first_line[:512] if first_line else "Job description analysis")


def _migrate_legacy_analyses(bind) -> None:
    rows = bind.execute(
        text(
            """
            SELECT id, original_filename, file_path, resume_text, job_description,
                   parsed_profile_json, match_result_json, overall_score, created_at
            FROM analyses
            """
        )
    ).mappings().all()

    op.rename_table("analyses", "analyses_legacy")
    _create_analyses()

    insert_resume = text(
        """
        INSERT INTO resumes (
            id, user_id, name, original_filename, file_type, file_size, stored_path,
            resume_text, parsed_profile_json, created_at, updated_at
        ) VALUES (
            :id, NULL, :name, :original_filename, :file_type, :file_size, :stored_path,
            :resume_text, :parsed_profile_json, :created_at, :created_at
        )
        """
    )
    insert_job = text(
        """
        INSERT INTO jobs (
            id, user_id, title, company_name, source_url, job_description,
            normalized_requirements_json, created_at, updated_at
        ) VALUES (
            :id, NULL, :title, NULL, NULL, :job_description,
            NULL, :created_at, :created_at
        )
        """
    )
    insert_analysis = text(
        """
        INSERT INTO analyses (
            id, user_id, resume_id, job_id, overall_score, match_result_json, created_at
        ) VALUES (
            :id, NULL, :resume_id, :job_id, :overall_score, :match_result_json, :created_at
        )
        """
    )

    for row in rows:
        resume_id = str(uuid.uuid4())
        job_id = str(uuid.uuid4())
        filename = row["original_filename"]
        file_type = Path(filename).suffix.lower() or ".unknown"
        name = Path(filename).stem[:255] or filename
        file_size = len(row["resume_text"] or "")
        bind.execute(
            insert_resume,
            {
                "id": resume_id,
                "name": name,
                "original_filename": filename,
                "file_type": file_type,
                "file_size": file_size,
                "stored_path": row["file_path"],
                "resume_text": row["resume_text"],
                "parsed_profile_json": row["parsed_profile_json"],
                "created_at": row["created_at"],
            },
        )
        bind.execute(
            insert_job,
            {
                "id": job_id,
                "title": _job_title_from_description(row["job_description"]),
                "job_description": row["job_description"],
                "created_at": row["created_at"],
            },
        )
        bind.execute(
            insert_analysis,
            {
                "id": row["id"],
                "resume_id": resume_id,
                "job_id": job_id,
                "overall_score": row["overall_score"],
                "match_result_json": row["match_result_json"],
                "created_at": row["created_at"],
            },
        )

    op.drop_table("analyses_legacy")


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if not inspector.has_table("users"):
        _create_users()
    if not inspector.has_table("resumes"):
        _create_resumes()
    if not inspector.has_table("jobs"):
        _create_jobs()

    if not inspector.has_table("analyses"):
        _create_analyses()
        return

    analysis_columns = {column["name"] for column in inspector.get_columns("analyses")}
    if "resume_id" in analysis_columns:
        return

    if "original_filename" in analysis_columns:
        _migrate_legacy_analyses(bind)
        return

    raise RuntimeError("Unsupported legacy analyses schema; manual migration required.")


def downgrade() -> None:
    inspector = inspect(op.get_bind())

    if inspector.has_table("analyses"):
        op.drop_index("ix_analyses_created_at", table_name="analyses")
        op.drop_index("ix_analyses_user_id_created_at", table_name="analyses")
        op.drop_index("ix_analyses_job_id", table_name="analyses")
        op.drop_index("ix_analyses_resume_id", table_name="analyses")
        op.drop_index("ix_analyses_user_id", table_name="analyses")
        op.drop_table("analyses")

    if inspector.has_table("jobs"):
        op.drop_index("ix_jobs_user_id_created_at", table_name="jobs")
        op.drop_index("ix_jobs_user_id", table_name="jobs")
        op.drop_table("jobs")

    if inspector.has_table("resumes"):
        op.drop_index("ix_resumes_user_id_created_at", table_name="resumes")
        op.drop_index("ix_resumes_user_id", table_name="resumes")
        op.drop_table("resumes")

    if inspector.has_table("users"):
        op.drop_index("ix_users_email", table_name="users")
        op.drop_table("users")
