from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings

BASE_FIELDS = [
    "id",
    "school.name",
    "school.city",
    "school.state",
    "school.school_url",
    "school.ownership",
    "school.locale",
    "latest.student.size",
    "latest.academic_year",
    "latest.completion.rate_suppressed.overall",
    "latest.cost.attendance.academic_year",
    "latest.earnings.10_yrs_after_entry.median",
    "latest.aid.median_debt.completers.overall",
    "latest.student.share_white",
    "latest.student.share_black",
    "latest.student.share_hispanic",
    "latest.student.share_asian",
    "latest.student.share_two_or_more",
    "latest.student.share_non_resident_alien",
    "latest.admissions.sat_scores.average.overall",
    "latest.admissions.act_scores.midpoint.cumulative",
    "latest.admissions.admission_rate.overall",
]

OWNERSHIP_MAP = {1: "Public", 2: "Private nonprofit", 3: "Private for-profit"}

LOCALE_MAP = {
    11: "City",
    12: "City",
    13: "City",
    21: "Suburban",
    22: "Suburban",
    23: "Suburban",
    31: "Town",
    32: "Town",
    33: "Town",
    41: "Rural",
    42: "Rural",
    43: "Rural",
}


class CollegeScorecardClient:
    def __init__(self) -> None:
        self.base_url = settings.college_scorecard_base_url.rstrip("/")
        self.api_key = settings.college_scorecard_api_key

    async def _get(self, path: str, params: dict[str, Any]) -> dict[str, Any]:
        query = {"api_key": self.api_key, "per_page": 25}
        query.update(params)
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(f"{self.base_url}{path}", params=query)
            response.raise_for_status()
            return response.json()

    async def search_schools(
        self,
        *,
        search: str | None = None,
        state: str | None = None,
        page: int = 0,
        per_page: int = 25,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {
            "page": page,
            "per_page": per_page,
            "fields": ",".join(BASE_FIELDS),
            "sort": "latest.student.size:desc",
        }
        if search:
            params["school.name"] = search
        if state:
            params["school.state"] = state
        payload = await self._get("/schools", params)
        schools = [self._map_school(result) for result in payload.get("results", [])]
        return {"results": schools, "metadata": payload.get("metadata", {})}

    async def get_school(self, unit_id: str) -> dict[str, Any] | None:
        params = {"id": unit_id, "fields": ",".join(BASE_FIELDS)}
        payload = await self._get("/schools", params)
        if not payload.get("results"):
            return None
        return self._map_school(payload["results"][0])

    def _map_school(self, record: dict[str, Any]) -> dict[str, Any]:
        ownership_code = record.get("school.ownership")
        locale_code = record.get("school.locale")
        graduation_rate = record.get("latest.completion.rate_suppressed.overall")
        avg_cost = record.get("latest.cost.attendance.academic_year")
        median_earnings = record.get("latest.earnings.10_yrs_after_entry.median")
        test_score = (
            record.get("latest.admissions.sat_scores.average.overall")
            or record.get("latest.admissions.act_scores.midpoint.cumulative")
        )
        acceptance_rate = record.get("latest.admissions.admission_rate.overall")
        diversity = {
            "white": record.get("latest.student.share_white"),
            "black": record.get("latest.student.share_black"),
            "hispanic": record.get("latest.student.share_hispanic"),
            "asian": record.get("latest.student.share_asian"),
            "two_or_more": record.get("latest.student.share_two_or_more"),
            "non_resident": record.get("latest.student.share_non_resident_alien"),
        }

        return {
            "unit_id": record.get("id"),
            "name": record.get("school.name"),
            "city": record.get("school.city"),
            "state": record.get("school.state"),
            "website": record.get("school.school_url"),
            "year": record.get("latest.academic_year"),
            "organization_type": OWNERSHIP_MAP.get(ownership_code, "Other"),
            "size": record.get("latest.student.size"),
            "location_type": LOCALE_MAP.get(locale_code, "Other"),
            "graduation_rate": graduation_rate,
            "average_annual_cost": avg_cost,
            "median_earnings": median_earnings,
            "financial_aid_debt": record.get("latest.aid.median_debt.completers.overall"),
            "typical_earnings": median_earnings,
            "campus_diversity": diversity,
            "test_score": test_score,
            "acceptance_rate": acceptance_rate,
        }


client = CollegeScorecardClient()
