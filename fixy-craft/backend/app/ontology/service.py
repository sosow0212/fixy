"""Ontology 도메인 service.

순수한 비동기 DB 접근 + 도메인 규칙 검증. 라우터는 얇게 유지한다.

참조 무결성 규칙(AGENTS.md):
- Link Type 의 source/target Object Type 은 존재해야 함 (검증 후 생성).
- Object Type 삭제 시 이를 source 또는 target 으로 참조하는 Link Type 이 있으면 거부(409).
"""
from __future__ import annotations

from datetime import datetime, timezone

from beanie import PydanticObjectId

from app.common.errors import BadRequestError, ConflictError, NotFoundError
from app.ontology.models import (
    ActionType,
    LinkType,
    ObjectType,
    PropertyDef,
)


# ────────── Object Type ──────────
async def list_object_types() -> list[ObjectType]:
    return await ObjectType.find_all().sort([("apiName", 1)]).to_list()


async def get_object_type(api_name: str) -> ObjectType:
    obj = await ObjectType.find_one(ObjectType.apiName == api_name)
    if not obj:
        raise NotFoundError(f"Object Type not found: {api_name}")
    return obj


async def create_object_type(
    api_name: str,
    display_name: str,
    properties: list[PropertyDef],
    description: str | None = None,
    icon: str | None = None,
) -> ObjectType:
    """Object Type 생성. isPrimaryKey 가 최대 1개여야 한다."""
    _validate_property_uniqueness(properties)
    _validate_primary_key_count(properties)

    if await ObjectType.find_one(ObjectType.apiName == api_name):
        raise ConflictError(f"Object Type apiName already exists: {api_name}")

    obj = ObjectType(
        apiName=api_name,
        displayName=display_name,
        description=description,
        icon=icon,
        properties=properties,
    )
    await obj.insert()
    return obj


async def add_property(api_name: str, prop: PropertyDef) -> ObjectType:
    """기존 Object Type 에 Property 추가. isPrimaryKey 2개 회피 검증 포함."""
    obj = await get_object_type(api_name)

    # apiName 중복 검사
    if any(p.apiName == prop.apiName for p in obj.properties):
        raise ConflictError(f"Property apiName already exists: {prop.apiName}")

    if prop.isPrimaryKey:
        existing_pk = [p.apiName for p in obj.properties if p.isPrimaryKey]
        if existing_pk:
            raise ConflictError(
                f"Object Type '{api_name}' already has primaryKey '{existing_pk[0]}'. "
                "하나의 Object Type 에는 primaryKey 가 1 개여야 합니다."
            )

    obj.properties.append(prop)
    obj.updatedAt = datetime.now(timezone.utc)
    await obj.save()
    return obj


async def delete_object_type(api_name: str) -> None:
    """참조 무결성: 다른 Link Type 이 참조하면 409."""
    obj = await get_object_type(api_name)
    by_src = await LinkType.find(LinkType.sourceObjectTypeApiName == api_name).to_list()
    by_tgt = await LinkType.find(LinkType.targetObjectTypeApiName == api_name).to_list()
    seen: dict = {}
    for lt in by_src + by_tgt:
        seen[lt.id] = lt
    referencing = list(seen.values())
    if referencing:
        names = ", ".join(sorted({lt.apiName for lt in referencing}))
        raise ConflictError(
            f"Object Type '{api_name}' 는 다음 Link Type 에서 참조되어 삭제할 수 없습니다: {names}"
        )
    # (추측) Action Type targetObjectTypeApiName 도 함께 막을지? 기획서엔 Object Type 만 명시.
    await obj.delete()


async def delete_property(api_name: str, prop_api_name: str) -> ObjectType:
    obj = await get_object_type(api_name)
    before = len(obj.properties)
    obj.properties = [p for p in obj.properties if p.apiName != prop_api_name]
    if len(obj.properties) == before:
        raise NotFoundError(f"Property not found: {prop_api_name}")
    obj.updatedAt = datetime.now(timezone.utc)
    await obj.save()
    return obj


# ────────── Link Type ──────────
async def list_link_types() -> list[LinkType]:
    return await LinkType.find_all().sort([("apiName", 1)]).to_list()


async def create_link_type(
    api_name: str,
    display_name: str,
    src_api_name: str,
    tgt_api_name: str,
    cardinality,
) -> LinkType:
    if src_api_name == tgt_api_name:
        raise BadRequestError("source 와 target Object Type 이 같을 수 없습니다.")
    if await LinkType.find_one(LinkType.apiName == api_name):
        raise ConflictError(f"Link Type apiName already exists: {api_name}")

    # 존재 검증 (FK 대용)
    await get_object_type(src_api_name)
    await get_object_type(tgt_api_name)

    lt = LinkType(
        apiName=api_name,
        displayName=display_name,
        sourceObjectTypeApiName=src_api_name,
        targetObjectTypeApiName=tgt_api_name,
        cardinality=cardinality,
    )
    await lt.insert()
    return lt


# ────────── Action Type ──────────
async def list_action_types() -> list[ActionType]:
    return await ActionType.find_all().sort([("apiName", 1)]).to_list()


async def get_action_type(api_name: str) -> ActionType:
    obj = await ActionType.find_one(ActionType.apiName == api_name)
    if not obj:
        raise NotFoundError(f"Action Type not found: {api_name}")
    return obj


async def create_action_type(
    api_name: str,
    display_name: str,
    target_object_type_api_name: str,
    definition: dict,
) -> ActionType:
    if await ActionType.find_one(ActionType.apiName == api_name):
        raise ConflictError(f"Action Type apiName already exists: {api_name}")
    # 대상 Object Type 존재 검증
    await get_object_type(target_object_type_api_name)

    _shallow_validate_definition(definition)

    obj = ActionType(
        apiName=api_name,
        displayName=display_name,
        targetObjectTypeApiName=target_object_type_api_name,
        definition=definition,
    )
    await obj.insert()
    return obj


# ────────── 검증 헬퍼 ──────────
def _validate_property_uniqueness(props: list[PropertyDef]) -> None:
    seen: set[str] = set()
    for p in props:
        if p.apiName in seen:
            raise BadRequestError(f"Property apiName 중복: {p.apiName}")
        seen.add(p.apiName)


def _validate_primary_key_count(props: list[PropertyDef]) -> None:
    pk_count = sum(1 for p in props if p.isPrimaryKey)
    if pk_count > 1:
        raise BadRequestError("primaryKey 는 Object Type 당 최대 1 개여야 합니다.")


def _shallow_validate_definition(definition: dict) -> None:
    """Action.definition 의 느슨한 검증 — 파라미터 name 유일성 정도."""
    if not isinstance(definition, dict):
        raise BadRequestError("definition 은 객체여야 합니다.")
    params = definition.get("parameters", [])
    if not isinstance(params, list):
        raise BadRequestError("definition.parameters 는 리스트여야 합니다.")
    seen: set[str] = set()
    for p in params:
        name = p.get("name") if isinstance(p, dict) else None
        if not isinstance(name, str) or not name:
            raise BadRequestError("parameter.name 은 필수입니다.")
        if name in seen:
            raise BadRequestError(f"parameter.name 중복: {name}")
        seen.add(name)


# PydanticObjectId 사용 안하므로 re-export 도 안 함 — 호환을 위해 자리만
_ = PydanticObjectId
