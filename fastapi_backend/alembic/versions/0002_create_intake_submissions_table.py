"""create intake submissions table

Revision ID: 0002
Revises: 0001
Create Date: 2025-12-15
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "intake_submissions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("payload", sa.JSON, nullable=False),
    )
    op.create_index("ix_intake_submissions_submitted_at", "intake_submissions", ["submitted_at"])


def downgrade() -> None:
    op.drop_index("ix_intake_submissions_submitted_at", table_name="intake_submissions")
    op.drop_table("intake_submissions")

