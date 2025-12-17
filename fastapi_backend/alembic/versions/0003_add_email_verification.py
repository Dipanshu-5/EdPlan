"""create email verification table

Revision ID: 0003
Revises: 0002
Create Date: 2025-12-17
"""

from alembic import op
import sqlalchemy as sa

from sqlalchemy import inspect

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = set(inspector.get_table_names())

    if "email_otps" not in tables:
        op.create_table(
            "email_otps",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("email", sa.String(length=256), nullable=False),
            sa.Column("code_hash", sa.String(length=128), nullable=False),
            sa.Column("attempts", sa.Integer, nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("verified_at", sa.DateTime(timezone=True)),
            sa.Column("consumed_at", sa.DateTime(timezone=True)),
        )
        op.create_index("ix_email_otps_email", "email_otps", ["email"])
        op.create_index("ix_email_otps_expires_at", "email_otps", ["expires_at"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = set(inspector.get_table_names())

    if "email_otps" in tables:
        op.drop_index("ix_email_otps_expires_at", table_name="email_otps")
        op.drop_index("ix_email_otps_email", table_name="email_otps")
        op.drop_table("email_otps")
