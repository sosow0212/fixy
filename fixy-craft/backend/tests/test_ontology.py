"""Phase 1 — Ontology 도메인 테스트.

happy path:
- Object Type 생성 → property 추가 → Link Type 생성

예외:
- 잘못된 apiName (Pascal/camel/screaming 위반)
- isPrimaryKey 2개
- 존재하지 않는 Object Type 으로 Link Type 생성
- Link Type 이 참조하는 Object Type 삭제 시도 (409)
"""
from __future__ import annotations

import pytest

from app.common.errors import BadRequestError, ConflictError, NotFoundError
from app.ontology import service
from app.ontology.models import DataType, PropertyDef


# ── 헬퍼 ────────────────────────────────────────────────────────────────────
def _person_props() -> list[PropertyDef]:
    return [
        PropertyDef(apiName="employeeId", displayName="사번", dataType=DataType.STRING, isPrimaryKey=True, isRequired=True),
        PropertyDef(apiName="name", displayName="이름", dataType=DataType.STRING, isRequired=True, isTitle=True),
    ]


def _company_props() -> list[PropertyDef]:
    return [
        PropertyDef(apiName="companyId", displayName="회사ID", dataType=DataType.STRING, isPrimaryKey=True, isRequired=True),
        PropertyDef(apiName="name", displayName="회사명", dataType=DataType.STRING, isRequired=True, isTitle=True),
    ]


# ── happy path ──────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_object_type_create_and_property_add(mongo_db):
    await service.create_object_type(
        api_name="Person", display_name="인물", properties=_person_props()
    )
    found = await service.get_object_type("Person")
    assert found.displayName == "인물"
    assert len(found.properties) == 2
    pk_props = [p for p in found.properties if p.isPrimaryKey]
    assert len(pk_props) == 1 and pk_props[0].apiName == "employeeId"


@pytest.mark.asyncio
async def test_link_type_create_requires_existing_object_types(mongo_db):
    await service.create_object_type(
        "Person", "인물", _person_props()
    )
    await service.create_object_type(
        "Company", "회사", _company_props()
    )
    lt = await service.create_link_type(
        api_name="WORKS_AT",
        display_name="근무",
        src_api_name="Person",
        tgt_api_name="Company",
        cardinality="MANY_TO_MANY",
    )
    assert lt.apiName == "WORKS_AT"


# ── 예외 ────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_object_type_invalid_apiname_rejected(mongo_db):
    with pytest.raises(ValueError):
        PropertyDef(apiName="1invalid", displayName="x", dataType=DataType.STRING)
    with pytest.raises(ValueError):
        await service.create_object_type(
            api_name="person",  # 소문자 시작 — PascalCase 아님
            display_name="인물",
            properties=_person_props(),
        )


@pytest.mark.asyncio
async def test_primary_key_too_many_rejected(mongo_db):
    bad = [
        PropertyDef(apiName="a", displayName="a", dataType=DataType.STRING, isPrimaryKey=True),
        PropertyDef(apiName="b", displayName="b", dataType=DataType.STRING, isPrimaryKey=True),
    ]
    with pytest.raises(BadRequestError):
        await service.create_object_type("Person", "인물", bad)


@pytest.mark.asyncio
async def test_link_type_with_missing_object_type_rejected(mongo_db):
    await service.create_object_type("Person", "인물", _person_props())
    with pytest.raises(NotFoundError):
        await service.create_link_type(
            api_name="WORKS_AT",
            display_name="근무",
            src_api_name="Person",
            tgt_api_name="NonExistent",
            cardinality="MANY_TO_MANY",
        )


@pytest.mark.asyncio
async def test_object_type_delete_blocked_by_referencing_link_type(mongo_db):
    await service.create_object_type("Person", "인물", _person_props())
    await service.create_object_type("Company", "회사", _company_props())
    await service.create_link_type(
        "WORKS_AT", "근무", "Person", "Company", "MANY_TO_MANY"
    )
    with pytest.raises(ConflictError):
        await service.delete_object_type("Person")


@pytest.mark.asyncio
async def test_duplicate_object_type_rejected(mongo_db):
    await service.create_object_type("Person", "인물", _person_props())
    with pytest.raises(ConflictError):
        await service.create_object_type("Person", "인물 또", _person_props())


@pytest.mark.asyncio
async def test_property_apiName_case_enforced(mongo_db):
    # camelCase OK
    p = PropertyDef(
        apiName="firstName",
        displayName="이름",
        dataType=DataType.STRING,
    )
    assert p.apiName == "firstName"

    # PascalCase 거부
    with pytest.raises(ValueError):
        PropertyDef(
            apiName="FirstName",  # PascalCase -> reject
            displayName="이름",
            dataType=DataType.STRING,
        )

    # snake_case 거부
    with pytest.raises(ValueError):
        PropertyDef(
            apiName="first_name",
            displayName="이름",
            dataType=DataType.STRING,
        )
