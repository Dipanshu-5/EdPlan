from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.global_data import CountryResponse, StateResponse
from app.services import global_service

router = APIRouter(prefix="/global", tags=["global"])


@router.get("/countries", response_model=list[CountryResponse])
async def list_countries(db: AsyncSession = Depends(get_db)):
    countries = await global_service.list_countries(db)
    return countries


@router.get("/states/{country_id}", response_model=list[StateResponse])
async def list_states(country_id: int, db: AsyncSession = Depends(get_db)):
    states = await global_service.list_states(db, country_id)
    return states
