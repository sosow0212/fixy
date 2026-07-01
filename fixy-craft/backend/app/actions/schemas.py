"""Actions (writeback) Pydantic 스키마."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class ActionApplyRequest(BaseModel):
    parameters: dict[str, Any] = Field(default_factory=dict)
    actor: Optional[str] = "admin"


class ActionApplyResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    changedObjectRid: Optional[str] = None
    changedProperties: dict[str, Any] = Field(default_factory=dict)
    auditRecorded: bool
    message: Optional[str] = None
