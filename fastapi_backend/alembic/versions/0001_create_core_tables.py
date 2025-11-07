"""create core tables

Revision ID: 0001
Revises: 
Create Date: 2024-11-07
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(length=256), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(length=512), nullable=False),
        sa.Column("first_name", sa.String(length=100)),
        sa.Column("last_name", sa.String(length=100)),
        sa.Column("phone_number", sa.String(length=32)),
        sa.Column("role", sa.Enum("admin", "customer", name="userrole"), nullable=False, server_default="customer"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("is_deactivated", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "customers",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("company_name", sa.String(length=150)),
        sa.Column("title", sa.String(length=150)),
        sa.Column("notes", sa.String(length=4000)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "education_plans",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("program_name", sa.String(length=256), nullable=False),
        sa.Column("university_name", sa.String(length=256), nullable=False),
        sa.Column("payload", sa.JSON, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "program_courses",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("education_plan_id", sa.Integer, sa.ForeignKey("education_plans.id", ondelete="CASCADE")),
        sa.Column("year_label", sa.String(length=64)),
        sa.Column("semester_label", sa.String(length=64)),
        sa.Column("course_code", sa.String(length=64)),
        sa.Column("course_name", sa.String(length=256)),
        sa.Column("credits", sa.Integer),
        sa.Column("prerequisite", sa.String(length=256)),
        sa.Column("corequisite", sa.String(length=256)),
        sa.Column("schedule", sa.JSON),
    )

    op.create_table(
        "course_schedules",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("education_plan_id", sa.Integer, sa.ForeignKey("education_plans.id", ondelete="CASCADE")),
        sa.Column("course_id", sa.Integer, sa.ForeignKey("program_courses.id", ondelete="SET NULL")),
        sa.Column("day", sa.String(length=32)),
        sa.Column("time", sa.String(length=32)),
        sa.Column("available", sa.Boolean, server_default=sa.true()),
    )

    op.create_table(
        "course_reschedules",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("requested_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("payload", sa.JSON, nullable=False),
    )

    op.create_table(
        "countries",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(length=128), nullable=False, unique=True),
    )

    op.create_table(
        "states",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("country_id", sa.Integer, sa.ForeignKey("countries.id", ondelete="CASCADE")),
    )


def downgrade() -> None:
    op.drop_table("states")
    op.drop_table("countries")
    op.drop_table("course_reschedules")
    op.drop_table("course_schedules")
    op.drop_table("program_courses")
    op.drop_table("education_plans")
    op.drop_table("customers")
    op.drop_table("users")
*** End of File
