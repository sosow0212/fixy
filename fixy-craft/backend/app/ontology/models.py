"""Beanie Document 모델 — Ontology 도메인.

컬렉션:
- object_types  : Object Type (Property 배열 embed)
- link_types    : Link Type (소스·타깃 Object Type 의 apiName 참조)
- action_types  : Action Type (definition: parameters/rules/effects embed)

모든 apiName 은 유니크 인덱스. 객체 무결성(참조 존재 여부)은 service 계층에서 검증한다.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from beanie import Document, Indexed
from pydantic import BaseModel, Field, field_validator

# ── 정규식 — apiName 규칙 ──────────────────────────────────────────────────────
RX_PASCAL = re.compile(r"^[A-Z][A-Za-z0-9]*$")          # Object Type
RX_CAMEL = re.compile(r"^[a-z][A-Za-z0-9]*$")           # Property
RX_SCREAMING = re.compile(r"^[A-Z][A-Z0-9_]*$")         # Link Type


# ── enums ───────────────────────────────────────────────────────────────────────
class DataType(str, Enum):
    STRING = "string"
    INTEGER = "integer"
    DOUBLE = "double"
    BOOLEAN = "boolean"
    DATE = "date"
    TIMESTAMP = "timestamp"
    GEO = "geo"


class Cardinality(str, Enum):
    ONE_TO_ONE = "ONE_TO_ONE"
    ONE_TO_MANY = "ONE_TO_MANY"
    MANY_TO_MANY = "MANY_TO_MANY"


# ── Property (embed) ────────────────────────────────────────────────────────────
class PropertyDef(BaseModel):
    apiName: str
    displayName: str
    dataType: DataType
    isRequired: bool = False
    isPrimaryKey: bool = False
    isTitle: bool = False

    @field_validator("apiName")
    @classmethod
    def _v_apiname(cls, v: str) -> str:
        if not RX_CAMEL.match(v):
            raise ValueError("Property apiName 은 camelCase 이어야 합니다 (예: firstName).")
        return v


# ── Object Type ─────────────────────────────────────────────────────────────────
class ObjectType(Document):
    apiName: Indexed(str, unique=True)
    displayName: str
    description: Optional[str] = None
    icon: Optional[str] = None
    properties: list[PropertyDef] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "object_types"

    @field_validator("apiName")
    @classmethod
    def _v_obj_apiname(cls, v: str) -> str:
        if not RX_PASCAL.match(v):
            raise ValueError("Object Type apiName 은 PascalCase 이어야 합니다 (예: Person).")
        return v


# ── Link Type ───────────────────────────────────────────────────────────────────
class LinkType(Document):
    apiName: Indexed(str, unique=True)
    displayName: str
    sourceObjectTypeApiName: str
    targetObjectTypeApiName: str
    cardinality: Cardinality = Cardinality.MANY_TO_MANY

    class Settings:
        name = "link_types"

    @field_validator("apiName")
    @classmethod
    def _v_link_apiname(cls, v: str) -> str:
        if not RX_SCREAMING.match(v):
            raise ValueError("Link Type apiName 은 SCREAMING_SNAKE_CASE 이어야 합니다 (예: WORKS_AT).")
        return v


# ── Action Type (parameters/rules/effects 자유 구조 — 느슨히 검증) ───────────────
class ActionType(Document):
    apiName: Indexed(str, unique=True)
    displayName: str
    targetObjectTypeApiName: str
    definition: dict[str, Any] = Field(default_factory=dict)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "action_types"

    @field_validator("apiName")
    @classmethod
    def _v_at(cls, v: str) -> str:
        if not RX_CAMEL.match(v):
            raise ValueError("Action Type apiName 은 camelCase 이어야 합니다 (예: assignRole).")
        return v
