"""Actions REST 라우터."""
from __future__ import annotations

from fastapi import APIRouter, status

from app.actions import engine
from app.actions.schemas import ActionApplyRequest, ActionApplyResponse

router = APIRouter(prefix="/api", tags=["actions"])


@router.post(
    "/actions/{action_api_name}/apply",
    response_model=ActionApplyResponse,
    status_code=status.HTTP_200_OK,
)
async def apply_action(action_api_name: str, payload: ActionApplyRequest) -> ActionApplyResponse:
    result = await engine.execute_action(
        action_api_name=action_api_name,
        parameters=payload.parameters,
        actor=payload.actor,
    )
    return ActionApplyResponse(**result)
