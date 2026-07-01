"""Actions 도메인 — AuditLog Document + Action definition sub-schemas.

Action Type 정의(parameters/rules/effects)의 부분 검증용 Pydantic 모델을 둔다.
Action Type 의 본체 Document 는 ontology 도메인에 있다 (메타데이터이기 때문).
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Optional

from beanie import Document, Indexed
from pydantic import BaseModel, Field, field_validator

RX_CAMEL = re.compile(r"^[a-z][A-Za-z0-9]*$")


# ── Action definition 부분 스키마 ─────────────────────────────────────────────
class ParameterDef(BaseModel):
    name: str
    type: str  # objectRid | string | integer | double | boolean | date
    required: bool = False
    allowed: Optional[list[Any]] = None  # 정의된 경우 그 안에 있어야 함

    @field_validator("name")
    @classmethod
    def _v(cls, v: str) -> str:
        if not RX_CAMEL.match(v):
            raise ValueError("parameter name 은 camelCase 이어야 합니다.")
        return v


class RuleDef(BaseModel):
    """rule.type:
    - setProperty : objectParam 으로 지정한 객체의 property 를 valueParam 값으로 SET
    - createLink  : sourceRidParam -> targetRidParam 사이에 linkTypeApiName MERGE
    - deleteLink  : 같은 위치의 관계를 DELETE
    """

    type: str
    objectParam: Optional[str] = None
    property: Optional[str] = None
    valueParam: Optional[str] = None
    linkTypeApiName: Optional[str] = None
    sourceRidParam: Optional[str] = None
    targetRidParam: Optional[str] = None
    direction: Optional[str] = None  # OUT|IN, default OUT


class EffectDef(BaseModel):
    type: str  # audit | (향후 webhook)
    message: Optional[str] = None


class ActionDefinition(BaseModel):
    parameters: list[ParameterDef] = Field(default_factory=list)
    rules: list[RuleDef] = Field(default_factory=list)
    effects: list[EffectDef] = Field(default_factory=list)


# ── Audit Log 문서 ─────────────────────────────────────────────────────────────
class AuditLog(Document):
    actionType: Indexed(str)
    actor: str
    payload: dict[str, Any] = Field(default_factory=dict)
    rid: Optional[str] = None  # 변경 대상 객체가 있으면 _rid 기록
    message: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "audit_log"
