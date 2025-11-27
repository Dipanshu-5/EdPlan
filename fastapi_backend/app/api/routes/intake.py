from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/intake", tags=["intake"])

_STORE = Path(__file__).resolve().parents[3] / "data" / "intake_submissions.json"
_STORE.parent.mkdir(parents=True, exist_ok=True)


@router.post("")
async def save_intake(payload: Dict[str, Any]):
    """Append intake form submission to a JSON file."""
    try:
        # Ensure file exists and is valid JSON
        if not _STORE.exists():
            _STORE.parent.mkdir(parents=True, exist_ok=True)
            _STORE.write_text("[]", encoding="utf-8")

        text = _STORE.read_text(encoding="utf-8").strip() or "[]"
        try:
            existing: list[dict[str, Any]] = json.loads(text)
        except json.JSONDecodeError:
            existing = []

        submission = {
            "submitted_at": datetime.utcnow().isoformat() + "Z",
            "data": payload,
        }
        existing.append(submission)
        _STORE.write_text(json.dumps(existing, indent=2), encoding="utf-8")
        return {"success": True, "message": "Saved"}
    except Exception as exc:  # pragma: no cover - simple persistence
        raise HTTPException(status_code=500, detail="Failed to save intake data") from exc
