from fastapi import APIRouter

from app.api.routes import customer, dashboard, global_data, intake, universities, users


def get_api_router() -> APIRouter:
    router = APIRouter()
    router.include_router(users.router, prefix="/api")
    router.include_router(global_data.router, prefix="/api")
    router.include_router(dashboard.router, prefix="/api")
    router.include_router(universities.router, prefix="/api")
    router.include_router(customer.router, prefix="/api")
    router.include_router(intake.router, prefix="/api")
    return router
