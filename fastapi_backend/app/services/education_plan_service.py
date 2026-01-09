from __future__ import annotations

from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import and_, delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.education_plan import CourseReschedule, EducationPlan, ProgramCourse
from app.models.user import User
from app.schemas.education import (
    EducationPlanListQuery,
    EducationPlanQuery,
    EducationPlanRequest,
    ProgramCoursePayload,
    RescheduleRequest,
)


def _normalize_degree(value: str | None) -> str:
    """Normalize degree strings for comparison (case/whitespace insensitive)."""
    if not value:
        return ""
    return str(value).strip().lower()


def _infer_program(payload: Sequence[ProgramCoursePayload]) -> tuple[str, str]:
    program_name = next((item.program for item in payload if item.program), None)
    university_name = next((item.university for item in payload if item.university), None)

    if not program_name or not university_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Program and university are required in at least one course entry.",
        )
    return program_name, university_name


async def add_or_replace_plan(
    db: AsyncSession, user: User, payload: EducationPlanRequest
) -> EducationPlan:
    if not payload.program:
        raise HTTPException(status_code=400, detail="Program payload is empty")

    program_name, university_name = _infer_program(payload.program)
    degree = payload.uniqueIdentifier.degree if payload.uniqueIdentifier else None

    existing = await get_plan_by_program(db, user.id, program_name, university_name, degree)
    plan_payload = {"program": [course.model_dump(by_alias=True) for course in payload.program]}
    if degree:
        plan_payload["degree"] = degree

    if existing:
        existing.payload = plan_payload
        await db.execute(
            delete(ProgramCourse).where(ProgramCourse.education_plan_id == existing.id)
        )
        await _persist_courses(db, existing, payload.program)
        await db.commit()
        await db.refresh(existing)
        return existing

    plan = EducationPlan(
        user_id=user.id,
        program_name=program_name,
        university_name=university_name,
        payload=plan_payload,
    )
    db.add(plan)
    await db.flush()
    await _persist_courses(db, plan, payload.program)
    await db.commit()
    await db.refresh(plan)
    return plan


async def _persist_courses(
    db: AsyncSession, plan: EducationPlan, courses: Sequence[ProgramCoursePayload]
) -> None:
    for entry in courses:
        db.add(
            ProgramCourse(
                education_plan_id=plan.id,
                year_label=entry.year,
                semester_label=entry.semester,
                course_code=entry.code,
                course_name=entry.course_name,
                credits=entry.credits,
                prerequisite=entry.prerequisite,
                corequisite=entry.corequisite,
                schedule=(
                    entry.schedule.model_dump()
                    if hasattr(entry.schedule, "model_dump")
                    else entry.schedule
                ),
            )
        )


async def get_plan_by_program(
    db: AsyncSession,
    user_id: int,
    program_name: str,
    university_name: str,
    degree: str | None = None,
) -> EducationPlan | None:
    stmt = select(EducationPlan).where(
        and_(
            EducationPlan.user_id == user_id,
            EducationPlan.program_name == program_name,
            EducationPlan.university_name == university_name,
        )
    )
    result = await db.execute(stmt)
    plans = result.scalars().all()

    # No specific degree requested; return the first match (maintains legacy behavior)
    if degree is None:
        return plans[0] if plans else None

    target_degree = _normalize_degree(degree)
    for plan in plans:
        existing_degree = _normalize_degree((plan.payload or {}).get("degree"))
        if existing_degree == target_degree:
            return plan

    return None


async def query_plan(db: AsyncSession, query: EducationPlanQuery) -> EducationPlan | None:
    stmt = select(EducationPlan).where(
        and_(
            EducationPlan.program_name == query.programname,
            EducationPlan.university_name == query.univerityname,
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_plans(db: AsyncSession, query: EducationPlanListQuery) -> Sequence[EducationPlan]:
    stmt = select(EducationPlan).where(EducationPlan.user.has(email=query.email.lower()))
    result = await db.execute(stmt)
    return result.scalars().all()


async def delete_plan(
    db: AsyncSession, user: User, program_name: str, university_name: str
) -> None:
    plan = await get_plan_by_program(db, user.id, program_name, university_name)
    if not plan:
        raise HTTPException(status_code=404, detail="Education plan not found")
    await db.delete(plan)
    await db.commit()


async def save_reschedule(
    db: AsyncSession, user: User, payload: RescheduleRequest
) -> CourseReschedule:
    entry = CourseReschedule(
        user_id=user.id, payload={"reschedule": [item.dict() for item in payload.reschedule]}
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry
