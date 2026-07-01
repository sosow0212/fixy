"""Phase 5 — 데모 시드 스크립트.

사용법:
    python -m app.scripts.seed_demo

동작:
1. Person / Company Object Type 생성 (필요 시 중복 무시)
2. WORKS_AT / INVESTED_IN Link Type 생성
3. assignRole Action Type 생성
4. 예제 CSV 를 임시 디렉토리에 저장 → DataSource 등록 (스토리지는 /data/uploads)
5. 매핑 정의
6. 인제스트 실행 → Neo4j 에 노드/링크 upsert

재실행 가능 (idempotent) — Beanie upsert + Neo4j MERGE 가정.
"""
from __future__ import annotations

import asyncio
import os

from app.actions.models import ActionDefinition
from app.common.errors import ConflictError
from app.config import settings
from app.db.mongo import close_mongo, init_mongo
from app.db.neo4j import close_neo4j
from app.ingestion import service as ing_service
from app.ingestion.models import (
    InferredColumn,
    MappingLink,
    MappingLinkTarget,
    MappingPrimaryKey,
    MappingProperty,
    ObjectMapping,
)
from app.ontology import service as ont_service
from app.ontology.models import DataType, PropertyDef


HERE = os.path.dirname(os.path.abspath(__file__))
EXAMPLE_DIR = os.path.abspath(
    os.path.join(HERE, "..", "..", "..", "docs", "ontology-examples")
)


# ── helpers ─────────────────────────────────────────────────────────────────
async def ensure_object_type(
    api_name: str,
    display_name: str,
    props: list[PropertyDef],
) -> None:
    try:
        await ont_service.create_object_type(api_name, display_name, props)
    except ConflictError:
        pass


async def ensure_link_type(
    api_name: str,
    display_name: str,
    src: str,
    tgt: str,
) -> None:
    from app.ontology.service import create_link_type, list_link_types

    existing = {lt.apiName for lt in await list_link_types()}
    if api_name in existing:
        return
    await create_link_type(
        api_name=api_name,
        display_name=display_name,
        src_api_name=src,
        tgt_api_name=tgt,
        cardinality="MANY_TO_MANY",
    )


async def ensure_action_type(
    api_name: str,
    display_name: str,
    target_ot: str,
    definition: ActionDefinition,
) -> None:
    from app.actions.models import ActionType

    existing = await ActionType.find_one(ActionType.apiName == api_name)
    if existing:
        return
    await ont_service.create_action_type(
        api_name=api_name,
        display_name=display_name,
        target_object_type_api_name=target_ot,
        definition=definition.model_dump(),
    )


def _read(path: str) -> bytes:
    with open(path, "rb") as f:
        return f.read()


# ── 메인 ────────────────────────────────────────────────────────────────────
async def main() -> None:
    await init_mongo()

    print("[1/5] Object Types 정의…")
    await ensure_object_type(
        "Company",
        "회사",
        [
            PropertyDef(
                apiName="companyId",
                displayName="회사ID",
                dataType=DataType.STRING,
                isPrimaryKey=True,
                isRequired=True,
            ),
            PropertyDef(
                apiName="name",
                displayName="회사명",
                dataType=DataType.STRING,
                isRequired=True,
                isTitle=True,
            ),
            PropertyDef(
                apiName="country",
                displayName="국가",
                dataType=DataType.STRING,
            ),
        ],
    )
    await ensure_object_type(
        "Person",
        "인물",
        [
            PropertyDef(
                apiName="employeeId",
                displayName="사번",
                dataType=DataType.STRING,
                isPrimaryKey=True,
                isRequired=True,
            ),
            PropertyDef(
                apiName="name",
                displayName="이름",
                dataType=DataType.STRING,
                isRequired=True,
                isTitle=True,
            ),
            PropertyDef(
                apiName="role",
                displayName="역할",
                dataType=DataType.STRING,
            ),
            PropertyDef(
                apiName="hireDate",
                displayName="입사일",
                dataType=DataType.DATE,
            ),
        ],
    )

    print("[2/5] Link Types 정의…")
    await ensure_link_type("WORKS_AT", "근무", "Person", "Company")
    await ensure_link_type("INVESTED_IN", "투자", "Company", "Company")

    print("[3/5] Action Type 정의…")
    definition = ActionDefinition(
        parameters=[
            {
                "name": "targetRid",
                "type": "objectRid",
                "required": True,
            },
            {
                "name": "newRole",
                "type": "string",
                "required": True,
                "allowed": [
                    "Engineer",
                    "Senior Engineer",
                    "Designer",
                    "Product Manager",
                    "Staff Engineer",
                ],
            },
        ],
        rules=[
            {
                "type": "setProperty",
                "objectParam": "targetRid",
                "property": "role",
                "valueParam": "newRole",
            }
        ],
        effects=[{"type": "audit", "message": "role changed"}],
    )
    await ensure_action_type("assignRole", "역할 배정", "Person", definition)

    print("[4/5] 데이터소스 업로드 + 매핑…")
    # Company 먼저 (Person 이 WORKS_AT 링크로 참조)
    comp_path = os.path.join(EXAMPLE_DIR, "companies.csv")
    emp_path = os.path.join(EXAMPLE_DIR, "employees.csv")
    inv_path = os.path.join(EXAMPLE_DIR, "investments.csv")

    ds_comp = await ing_service.create_data_source(
        name="companies.csv",
        original_filename="companies.csv",
        content=_read(comp_path),
    )
    ds_comp.mappings = [
        ObjectMapping(
            objectTypeApiName="Company",
            primaryKey=MappingPrimaryKey(column="companyId", property="companyId"),
            properties=[
                MappingProperty(column="name", property="name"),
                MappingProperty(column="country", property="country"),
            ],
            links=[],
        )
    ]
    await ds_comp.save()

    ds_emp = await ing_service.create_data_source(
        name="employees.csv",
        original_filename="employees.csv",
        content=_read(emp_path),
    )
    ds_emp.mappings = [
        ObjectMapping(
            objectTypeApiName="Person",
            primaryKey=MappingPrimaryKey(column="employeeId", property="employeeId"),
            properties=[
                MappingProperty(column="name", property="name"),
                MappingProperty(column="role", property="role"),
                MappingProperty(column="hireDate", property="hireDate", transform="to_date"),
            ],
            links=[
                MappingLink(
                    linkTypeApiName="WORKS_AT",
                    direction="OUT",
                    target=MappingLinkTarget(
                        objectTypeApiName="Company",
                        matchColumn="companyId",
                        matchProperty="companyId",
                    ),
                )
            ],
        )
    ]
    await ds_emp.save()

    ds_inv = await ing_service.create_data_source(
        name="investments.csv",
        original_filename="investments.csv",
        content=_read(inv_path),
    )
    ds_inv.mappings = [
        ObjectMapping(
            objectTypeApiName="Company",
            primaryKey=MappingPrimaryKey(column="fromCompanyId", property="companyId"),
            properties=[],
            links=[
                MappingLink(
                    linkTypeApiName="INVESTED_IN",
                    direction="OUT",
                    target=MappingLinkTarget(
                        objectTypeApiName="Company",
                        matchColumn="toCompanyId",
                        matchProperty="companyId",
                    ),
                )
            ],
        )
    ]
    await ds_inv.save()

    print("[5/5] 인제스트 실행…")
    for ds in [ds_comp, ds_emp, ds_inv]:
        job = await ing_service.run_ingest(str(ds.id))
        print(
            f"  · {ds.name}: status={job.status.value} "
            f"생성 노드 {job.createdNodes} 갱신 노드 {job.updatedNodes} "
            f"링크 {job.createdLinks} 오류 행 {len(job.errorRows)}"
        )

    print("✅ 시드 완료. http://localhost:3000 에서 확인하세요.")
    await close_neo4j()
    await close_mongo()


if __name__ == "__main__":
    asyncio.run(main())
