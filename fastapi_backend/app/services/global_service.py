from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.education_plan import Country, State


async def list_countries(db: AsyncSession):
    result = await db.execute(select(Country))
    return result.scalars().all()


async def list_states(db: AsyncSession, country_id: int):
    result = await db.execute(select(State).where(State.country_id == country_id))
    return result.scalars().all()
