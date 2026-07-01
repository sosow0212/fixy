"""Ontology 도메인 Pydantic 스키마 (요청/응답)."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.ontology.models import Cardinality, DataType, PropertyDef


# ── Object Type ────────────────────────────────────────────────────────────────
class ObjectTypeCreate(BaseModel):
    apiName: str
    displayName: str
    description: Optional[str] = None
    icon: Optional[str] = None
    properties: list[PropertyDef] = Field(default_factory=list)


class ObjectTypeRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    apiName: str
    displayName: str
    description: Optional[str] = None
    icon: Optional[str] = None
    properties: list[PropertyDef]
    createdAt: datetime
    updatedAt: datetime


class PropertyCreate(BaseModel):
    apiName: str
    displayName: str
    dataType: DataType
    isRequired: bool = False
    isPrimaryKey: bool = False
    isTitle: bool = False


# ── Link Type ──────────────────────────────────────────────────────────────────
class LinkTypeCreate(BaseModel):
    apiName: str
    displayName: str
    sourceObjectTypeApiName: str
    targetObjectTypeApiName: str
    cardinality: Cardinality = Cardinality.MANY_TO_MANY


class LinkTypeRead(BaseModel):
    apiName: str
    displayName: str
    sourceObjectTypeApiName: str
    targetObjectTypeApiName: str
    cardinality: Cardinality


# ── Action Type ────────────────────────────────────────────────────────────────
class ActionTypeCreate(BaseModel):
    apiName: str
    displayName: str
    targetObjectTypeApiName: str
    definition: dict[str, Any] = Field(default_factory=dict)


class ActionTypeRead(BaseModel):
    apiName: str
    displayName: str
    targetObjectTypeApiName: str
    definition: dict[str, Any]
    createdAt: datetime
    updatedAt: datetime
