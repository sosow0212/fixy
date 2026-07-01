"""Objects (조회) REST 라우터."""
from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Query, Request

from app.common.errors import BadRequestError
from app.objects import service
from app.objects.schemas import (
    GraphSearchHit,
    GraphView,
    ObjectDetail,
    ObjectSet,
    RelatedNode,
)

router = APIRouter(prefix="/api", tags=["objects"])


@router.get("/objects/{type_api_name}", response_model=ObjectSet)
async def list_objects(
    type_api_name: str,
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0, le=10_000),
    sort: Optional[str] = Query(None, description="property:asc|desc"),
    filter: Optional[str] = Query(None, description='JSON of {"prop": "value"}'),
) -> ObjectSet:
    sort_property = None
    sort_direction = "ASC"
    if sort:
        try:
            sort_property, sort_direction = sort.split(":")
        except ValueError as e:
            raise BadRequestError("sort 는 'property:asc|desc' 형식이어야 합니다.") from e
    property_filter: dict | None = None
    if filter:
        try:
            property_filter = json.loads(filter)
        except json.JSONDecodeError as e:
            raise BadRequestError("filter 는 JSON 객체 문자열이어야 합니다.") from e
        if not isinstance(property_filter, dict):
            raise BadRequestError("filter 는 JSON 객체이어야 합니다.")
    return await service.list_objects(
        type_api_name=type_api_name,
        property_filter=property_filter,
        limit=limit,
        offset=offset,
        sort_property=sort_property,
        sort_direction=sort_direction,
    )


@router.get("/objects/{type_api_name}/{rid}", response_model=ObjectDetail)
async def get_object(type_api_name: str, rid: str) -> ObjectDetail:
    return await service.get_object(type_api_name, rid)


@router.get(
    "/objects/{type_api_name}/{rid}/links",
    response_model=list[RelatedNode],
)
async def list_related_objects(
    type_api_name: str,
    rid: str,
    linkType: Optional[str] = None,
    direction: str = "OUT",
    limit: int = Query(100, ge=1, le=500),
) -> list[RelatedNode]:
    return await service.list_related_objects(
        type_api_name=type_api_name,
        rid=rid,
        link_type=linkType,
        direction=direction,
        limit=limit,
    )


@router.post("/graph/expand", response_model=GraphView)
async def expand_graph(payload: dict) -> GraphView:
    start_rid = payload.get("startRid")
    depth = int(payload.get("depth", 1))
    link_types = payload.get("linkTypes")
    if not isinstance(start_rid, str) or not start_rid:
        raise BadRequestError("startRid 는 필수 문자열입니다.")
    return await service.expand_graph(start_rid, depth=depth, link_types=link_types)


@router.post("/graph/search", response_model=list[GraphSearchHit])
async def search_graph(payload: dict) -> list[GraphSearchHit]:
    q = payload.get("q", "")
    if not isinstance(q, str) or not q:
        raise BadRequestError("q 는 필수 문자열입니다.")
    limit = int(payload.get("limit", 50))
    return await service.search_graph(q, limit=limit)
