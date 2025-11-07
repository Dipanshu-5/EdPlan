from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.education_plan import CourseReschedule, EducationPlan
from app.models.user import Customer, User


async def get_counts(db: AsyncSession) -> dict:
    total_users = await db.scalar(select(func.count(User.id))) or 0
    total_customers = await db.scalar(select(func.count(Customer.id))) or 0
    total_plans = await db.scalar(select(func.count(EducationPlan.id))) or 0
    total_reschedules = await db.scalar(select(func.count(CourseReschedule.id))) or 0

    return {
        "customers": total_customers or total_users,
        "plans": total_plans,
        "reschedules": total_reschedules,
    }
