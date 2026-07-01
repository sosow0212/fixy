"""Objects (조회) Pydantic 스키마."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class ObjectSummary(BaseModel):
    rid: str
    typeApiName: str
    title: Optional[str] = None
    properties: dict[str, Any] = Field(default_factory=dict)


class ObjectSet(BaseModel):
    items: list[ObjectSummary]
    total: int
    limit: int
    offset: int


class LinkCountByType(BaseModel):
    linkTypeApiName: str
    direction: str  # OUT | IN
    count: int


class ObjectDetail(BaseModel):
    rid: str
    typeApiName: str
    properties: dict[str, Any] = Field(default_factory=dict)
    linkCounts: list[LinkCountByType]


class RelatedNode(BaseModel):
    rid: str
    typeApiName: str
    title: Optional[str] = None
    properties: dict[str, Any] = Field(default_factory=dict)


class RelatedEdge(BaseModel):
    rid: Optional[str] = None
    type: str
    source: str
    target: str


class GraphNode(BaseModel):
    id: str
    type: str
    title: Optional[str] = None


class GraphEdge(BaseModel):
    source: str
    target: str
    type: str


class GraphView(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class GraphSearchHit(BaseModel):
    rid: str
    typeApiName: str
    title: Optional[str] = None
    matchedProperty: str
    matchedValue: Any
