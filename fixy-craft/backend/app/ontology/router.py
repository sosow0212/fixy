"""Ontology REST 라우터."""
from __future__ import annotations

from fastapi import APIRouter, status

from app.ontology import service
from app.ontology.models import PropertyDef
from app.ontology.schemas import (
    ActionTypeCreate,
    ActionTypeRead,
    LinkTypeCreate,
    LinkTypeRead,
    ObjectTypeCreate,
    ObjectTypeRead,
    PropertyCreate,
)

router = APIRouter(prefix="/api", tags=["ontology"])


# ── Object Type ───────────────────────────────────────────────────────────────
@router.post(
    "/object-types",
    response_model=ObjectTypeRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_object_type(payload: ObjectTypeCreate) -> ObjectTypeRead:
    obj = await service.create_object_type(
        api_name=payload.apiName,
        display_name=payload.displayName,
        properties=payload.properties,
        description=payload.description,
        icon=payload.icon,
    )
    return _obj_to_read(obj)


@router.get("/object-types", response_model=list[ObjectTypeRead])
async def list_object_types() -> list[ObjectTypeRead]:
    return [_obj_to_read(o) for o in await service.list_object_types()]


@router.get("/object-types/{api_name}", response_model=ObjectTypeRead)
async def get_object_type(api_name: str) -> ObjectTypeRead:
    obj = await service.get_object_type(api_name)
    return _obj_to_read(obj)


@router.post(
    "/object-types/{api_name}/properties",
    response_model=ObjectTypeRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_property(api_name: str, payload: PropertyCreate) -> ObjectTypeRead:
    prop = PropertyDef(**payload.model_dump())
    obj = await service.add_property(api_name, prop)
    return _obj_to_read(obj)


@router.delete(
    "/object-types/{api_name}/properties/{prop_api_name}",
    response_model=ObjectTypeRead,
)
async def delete_property(api_name: str, prop_api_name: str) -> ObjectTypeRead:
    obj = await service.delete_property(api_name, prop_api_name)
    return _obj_to_read(obj)


@router.delete("/object-types/{api_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_object_type(api_name: str) -> None:
    await service.delete_object_type(api_name)


# ── Link Type ─────────────────────────────────────────────────────────────────
@router.post(
    "/link-types",
    response_model=LinkTypeRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_link_type(payload: LinkTypeCreate) -> LinkTypeRead:
    lt = await service.create_link_type(
        api_name=payload.apiName,
        display_name=payload.displayName,
        src_api_name=payload.sourceObjectTypeApiName,
        tgt_api_name=payload.targetObjectTypeApiName,
        cardinality=payload.cardinality,
    )
    return LinkTypeRead(**lt.model_dump())


@router.get("/link-types", response_model=list[LinkTypeRead])
async def list_link_types() -> list[LinkTypeRead]:
    return [LinkTypeRead(**lt.model_dump()) for lt in await service.list_link_types()]


# ── Action Type ────────────────────────────────────────────────────────────────
@router.post(
    "/action-types",
    response_model=ActionTypeRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_action_type(payload: ActionTypeCreate) -> ActionTypeRead:
    obj = await service.create_action_type(
        api_name=payload.apiName,
        display_name=payload.displayName,
        target_object_type_api_name=payload.targetObjectTypeApiName,
        definition=payload.definition,
    )
    return ActionTypeRead(**obj.model_dump())


@router.get("/action-types", response_model=list[ActionTypeRead])
async def list_action_types() -> list[ActionTypeRead]:
    return [ActionTypeRead(**o.model_dump()) for o in await service.list_action_types()]


@router.get("/action-types/{api_name}", response_model=ActionTypeRead)
async def get_action_type(api_name: str) -> ActionTypeRead:
    obj = await service.get_action_type(api_name)
    return ActionTypeRead(**obj.model_dump())


def _obj_to_read(obj) -> ObjectTypeRead:
    return ObjectTypeRead(**obj.model_dump())
