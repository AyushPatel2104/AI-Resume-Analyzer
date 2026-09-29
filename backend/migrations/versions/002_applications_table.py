"""Applications tracker table.

Revision ID: 002_applications
Revises: 001_baseline_domain
Create Date: 2026-03-29
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "002_applications"
down_revision: Union[str, None] = "001_baseline_domain"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if inspect(bind).has_table("applications"):
        # Idempotent: never drop populated production data on restart.
        return

    op.create_table(
        "applications",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.String(length=36), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("resume_id", sa.String(length=36), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="SAVED"),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("follow_up_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("source", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.UniqueConstraint("user_id", "job_id", "resume_id", name="uq_applications_user_job_resume"),
    )
    op.create_index("ix_applications_user_id", "applications", ["user_id"], unique=False)
    op.create_index("ix_applications_user_id_status", "applications", ["user_id", "status"], unique=False)
    op.create_index("ix_applications_user_id_updated_at", "applications", ["user_id", "updated_at"], unique=False)
    op.create_index("ix_applications_follow_up_date", "applications", ["follow_up_date"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    if not inspect(bind).has_table("applications"):
        return
    op.drop_index("ix_applications_follow_up_date", table_name="applications")
    op.drop_index("ix_applications_user_id_updated_at", table_name="applications")
    op.drop_index("ix_applications_user_id_status", table_name="applications")
    op.drop_index("ix_applications_user_id", table_name="applications")
    op.drop_table("applications")
