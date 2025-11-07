from fastapi import APIRouter, HTTPException, Query

from app.clients.college_scorecard import client as scorecard_client
from app.schemas.university import CompareRequest, University

router = APIRouter(prefix="/universities", tags=["universities"])


@router.get("", response_model=dict)
async def search_universities(
    search: str | None = None,
    state: str | None = None,
    page: int = 0,
    per_page: int = Query(10, ge=1, le=100),
):
    payload = await scorecard_client.search_schools(
    page=page, per_page=per_page, search=search, state=state
    )
    return {
        "success": True,
        "data": payload["results"],
        "metadata": payload.get("metadata"),
    }


@router.get("/{unit_id}", response_model=dict)
async def get_university(unit_id: str):
    school = await scorecard_client.get_school(unit_id)
    if not school:
        raise HTTPException(status_code=404, detail="University not found")
    return {"success": True, "data": school}


@router.post("/compare", response_model=dict)
async def compare_universities(payload: CompareRequest):
    results: list[University] = []
    for unit_id in payload.unit_ids[:5]:
        school = await scorecard_client.get_school(unit_id)
        if school:
            results.append(University(**school))
    return {"success": True, "data": [item.model_dump() for item in results]}
