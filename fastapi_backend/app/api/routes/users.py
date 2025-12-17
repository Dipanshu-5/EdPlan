from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, UserProfile
from app.schemas.education import (
    EducationPlanListQuery,
    EducationPlanQuery,
    EducationPlanRequest,
    RescheduleRequest,
)
from app.security.auth import create_access_token
from app.services import education_plan_service, user_service
from app.utils.email import send_email
from app.utils.sms import send_sms

router = APIRouter(tags=["users"])


@router.post("/users")
async def register_user(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await user_service.register_user(db, payload)
    token = create_access_token(user.email)
    profile = UserProfile.model_validate(user)
    return {
        "success": True,
        "message": "User registered successfully",
        "data": {"bearer_token": token, "profile": profile.model_dump()},
    }


@router.post("/users/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await user_service.authenticate_user(db, payload.email, payload.password)
    token = create_access_token(user.email)
    profile = UserProfile.model_validate(user)
    return {
        "success": True,
        "message": "You are logged in successfully.",
        "data": {
            "bearer_token": token,
            "role": str(user.role.value if hasattr(user.role, "value") else user.role),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "profile": profile.model_dump(),
        },
    }


@router.post("/users/education-plan")
async def add_education_plan(request: EducationPlanRequest, db: AsyncSession = Depends(get_db)):
    user = await user_service.get_user_by_email(db, request.emailaddress)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    plan = await education_plan_service.add_or_replace_plan(db, user, request)
    return {"success": True, "message": "Education plan saved", "data": plan.payload}


@router.post("/users/education-plan/query")
async def query_education_plan(request: EducationPlanQuery, db: AsyncSession = Depends(get_db)):
    plan = await education_plan_service.query_plan(db, request)
    if not plan:
        return {"success": True, "message": "No education plan found", "data": None}
    return {"success": True, "message": "Plan retrieved", "data": plan.payload}


@router.post("/users/education-plan/list")
async def list_plans(request: EducationPlanListQuery, db: AsyncSession = Depends(get_db)):
    plans = await education_plan_service.list_plans(db, request)
    data = [plan.payload for plan in plans]
    return {"success": True, "message": "Plans loaded", "data": data}


@router.post("/users/education-plan/reschedule")
async def reschedule_courses(request: RescheduleRequest, db: AsyncSession = Depends(get_db)):
    user = await user_service.get_user_by_email(db, request.emailaddress)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    entry = await education_plan_service.save_reschedule(db, user, request)
    return {"success": True, "message": "Reschedule request queued", "data": entry.payload}


@router.post("/users/email-advisor")
async def email_advisor(data: dict):
    email = data.get("email")
    advisor_email = data.get("advisorEmail")
    body = data.get("body", "")
    if not (email and advisor_email):
        raise HTTPException(status_code=400, detail="email and advisorEmail are required")
    send_email("Education plan", body or "Education plan update", advisor_email)
    if phone := data.get("phone"):
        send_sms(f"New education-plan request from {email}", phone)
    return {"success": True, "message": "Advisor notified", "data": None}


@router.post("/users/email-verification/request")
async def request_email_verification(data: dict):
    """Email verification is currently disabled."""
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="email is required")

    return {
        "success": True,
        "message": "Email verification is disabled. You can continue signup.",
        "data": {"email": email},
    }


@router.get("/users/email-verification/status")
async def get_email_verification_status(email: str):
    """Check if email is verified (simplified implementation)"""
    if not email:
        raise HTTPException(status_code=400, detail="email parameter is required")

    # In a production app, you would check the database for verification status
    # For development, we'll always return verified=True to simplify testing

    return {
        "success": True,
        "message": "Verification status retrieved",
        "data": {"verified": True, "email": email},
    }
