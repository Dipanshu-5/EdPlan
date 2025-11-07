from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import models for Alembic metadata
from app import models  # noqa: E402,F401  # pylint: disable=wrong-import-position
