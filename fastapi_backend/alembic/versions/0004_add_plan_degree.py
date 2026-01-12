"""add degree to education plans

Revision ID: 0004
Revises: 0003
Create Date: 2025-01-09
"""

from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("education_plans", sa.Column("degree", sa.String(length=128)))


def downgrade() -> None:
    op.drop_column("education_plans", "degree")
