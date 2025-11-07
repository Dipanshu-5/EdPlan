from pydantic import BaseModel


class DiversityStats(BaseModel):
    white: float | None = None
    black: float | None = None
    hispanic: float | None = None
    asian: float | None = None
    two_or_more: float | None = None
    non_resident: float | None = None


class University(BaseModel):
    unit_id: int | None = None
    name: str | None = None
    city: str | None = None
    state: str | None = None
    website: str | None = None
    year: int | None = None
    organization_type: str | None = None
    size: int | None = None
    location_type: str | None = None
    graduation_rate: float | None = None
    average_annual_cost: float | None = None
    median_earnings: float | None = None
    financial_aid_debt: float | None = None
    typical_earnings: float | None = None
    campus_diversity: DiversityStats | None = None
    test_score: float | None = None
    acceptance_rate: float | None = None


class CompareRequest(BaseModel):
    unit_ids: list[str]
