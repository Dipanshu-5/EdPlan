from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.dashboard import DashboardCounts
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardCounts)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    counts = await dashboard_service.get_counts(db)
    return DashboardCounts(**counts)
