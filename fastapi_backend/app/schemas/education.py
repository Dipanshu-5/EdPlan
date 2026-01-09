from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class ScheduleBlock(BaseModel):
    day: str | None = None
    time: str | None = None


class ProgramCoursePayload(BaseModel):
    program: str | None = None
    university: str | None = None
    year: str | None = None
    semester: str | None = None
    code: str | None = None
    course_name: str | None = Field(None, alias="courseName")
    credits: int | None = None
    prerequisite: str | None = None
    corequisite: str | None = None
    schedule: ScheduleBlock | dict | None = None

    class Config:
        populate_by_name = True


class UniqueIdentifier(BaseModel):
    university: str | None = None
    program: str | None = None
    degree: str | None = None


class EducationPlanRequest(BaseModel):
    emailaddress: EmailStr
    program: list[ProgramCoursePayload]
    rescheduledata: list[ProgramCoursePayload] | None = None
    reschedule: list[RescheduleEntry] | None = None
    uniqueIdentifier: UniqueIdentifier | None = None


class EducationPlanQuery(BaseModel):
    email: EmailStr
    programname: str
    univerityname: str


class EducationPlanDeleteRequest(BaseModel):
    email: EmailStr
    programname: str
    univerityname: str


class EducationPlanListQuery(BaseModel):
    email: EmailStr


class RescheduleEntry(BaseModel):
    day: str | None = None
    fromtime: str | None = None
    totime: str | None = None


class RescheduleRequest(BaseModel):
    emailaddress: EmailStr
    reschedule: list[RescheduleEntry]


class EducationPlanResponse(BaseModel):
    program: list[ProgramCoursePayload]
