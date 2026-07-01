"""Ingestion 서비스 — 파일 파싱, 매핑 검증, Neo4j 하이드레이션.

(추측) 사이드 프로젝트 규모이므로 인제스트를 동기 함수로 처리한다. 행 단위 트랜잭션 +
실패 행 수집. 페이즈 5 에서 대용량 시 백그라운드 잡으로 전환 여부 결정.

Cypher 안전성 정책 (AGENTS.md 준수):
- Label / 관계 타입 / Property name 은 f-string 으로 끼워넣되, 그 값은
  Beanie 가 검증해 저장한 Object Type / Link Type / ObjectMapping 정의에서만 가져온다.
  (사용자 raw 입력이 Cypher 에 직접 결합되는 일은 없음)
- 사용자 데이터(행 값)는 반드시 $ 파라미터 바인딩.
"""
from __future__ import annotations

import csv
import json
import os
import re
import uuid as _u
from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId

from app.common.errors import BadRequestError, NotFoundError
from app.config import settings
from app.db.neo4j import get_neo4j_driver
from app.ingestion.models import (
    DataSource,
    IngestJob,
    IngestStatus,
    InferredColumn,
    ObjectMapping,
)
from app.ontology.models import LinkType, ObjectType


# ── 데이터 타입 추론 ───────────────────────────────────────────────────────────
_INT_RE = re.compile(r"^-?\d+$")
_FLOAT_RE = re.compile(r"^-?\d+\.\d+$")
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _infer_type(values: list[str]) -> str:
    sample = [v for v in values if v not in ("", None)]
    if not sample:
        return "string"
    if all(_INT_RE.match(str(v)) for v in sample):
        return "integer"
    if all(_FLOAT_RE.match(str(v)) for v in sample):
        return "double"
    if all(str(v).lower() in ("true", "false") for v in sample):
        return "boolean"
    if all(_DATE_RE.match(str(v)) for v in sample):
        return "date"
    return "string"


# ── 파일에서 row 읽기 ──────────────────────────────────────────────────────────
async def _read_csv(storage_path: str) -> tuple[list[str], list[dict[str, str]]]:
    with open(storage_path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        header = list(reader.fieldnames or [])
        rows = [
            {k: ("" if v is None else str(v)) for k, v in row.items()}
            for row in reader
        ]
    return header, rows


async def _read_json(storage_path: str) -> tuple[list[str], list[dict[str, Any]]]:
    with open(storage_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise BadRequestError("JSON 은 객체 배열(list[dict]) 이어야 합니다.")
    rows = [d if isinstance(d, dict) else {} for d in data]
    keys: list[str] = []
    for r in rows:
        for k in r.keys():
            if k not in keys:
                keys.append(k)
    return keys, rows


# ── 추론 스키마 빌드 ───────────────────────────────────────────────────────────
async def _build_inferred_schema(
    kind: str,
    storage_path: str,
    sample_size: int = 50,
) -> list[InferredColumn]:
    if kind == "csv":
        _h, rows = await _read_csv(storage_path)
    elif kind == "json":
        _h, rows = await _read_json(storage_path)
    else:
        raise BadRequestError(f"지원하지 않는 kind: {kind}")

    head: dict[str, list[str]] = {}
    for r in rows[:sample_size]:
        for k, v in r.items():
            head.setdefault(k, []).append("" if v is None else str(v))

    return [InferredColumn(column=k, inferredType=_infer_type(head[k])) for k in head.keys()]


# ── 파일 저장 ─────────────────────────────────────────────────────────────────
async def save_uploaded_file(original_filename: str, content: bytes) -> tuple[str, str]:
    os.makedirs(settings.upload_dir, exist_ok=True)
    ext = os.path.splitext(original_filename)[1].lower()
    if ext == ".csv":
        kind = "csv"
    elif ext == ".json":
        kind = "json"
    else:
        raise BadRequestError(f"허용되지 않는 파일 확장자: {ext}")
    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", os.path.basename(original_filename))
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    abs_path = os.path.join(settings.upload_dir, f"{ts}_{safe_name}")
    with open(abs_path, "wb") as f:
        f.write(content)
    return abs_path, kind


# ── DataSource 등록 ───────────────────────────────────────────────────────────
async def create_data_source(name: str, original_filename: str, content: bytes) -> DataSource:
    abs_path, kind = await save_uploaded_file(original_filename, content)
    schema = await _build_inferred_schema(kind, abs_path)
    ds = DataSource(name=name, kind=kind, storagePath=abs_path, schema=schema)
    await ds.insert()
    return ds


async def list_data_sources() -> list[DataSource]:
    return await DataSource.find_all().sort([("uploadedAt", -1)]).to_list()


async def get_data_source(ds_id: str) -> DataSource:
    try:
        oid = ObjectId(ds_id)
    except Exception as e:
        raise BadRequestError(f"잘못된 data source id: {ds_id}") from e
    ds = await DataSource.get(oid)
    if not ds:
        raise NotFoundError(f"DataSource not found: {ds_id}")
    return ds


# ── 매핑 검증 ────────────────────────────────────────────────────────────────
async def validate_mappings_async(ds: DataSource, mappings: list[ObjectMapping]) -> None:
    known_columns = {c.column for c in ds.schema}
    seen_objtypes: dict[str, ObjectType] = {}

    for m in mappings:
        ot = seen_objtypes.get(m.objectTypeApiName)
        if ot is None:
            ot = await ObjectType.find_one(ObjectType.apiName == m.objectTypeApiName)
            if not ot:
                raise BadRequestError(f"대상 Object Type 이 존재하지 않습니다: {m.objectTypeApiName}")
            seen_objtypes[m.objectTypeApiName] = ot

        pk_prop = next((p for p in ot.properties if p.isPrimaryKey), None)
        if pk_prop is None:
            raise BadRequestError(
                f"Object Type '{m.objectTypeApiName}' 에 isPrimaryKey 가 지정된 Property 가 없습니다."
            )
        if pk_prop.apiName != m.primaryKey.property:
            raise BadRequestError(
                f"매핑 primaryKey.property='{m.primaryKey.property}' 가 "
                f"Object Type '{m.objectTypeApiName}' 의 isPrimaryKey '{pk_prop.apiName}' 와 일치하지 않습니다."
            )

        cols = (
            [m.primaryKey.column]
            + [p.column for p in m.properties]
            + [l.target.matchColumn for l in m.links]
        )
        if len(set(cols)) != len(cols):
            raise BadRequestError(f"매핑 '{m.objectTypeApiName}' 의 컬럼 사용이 중복됩니다: {cols}")
        for c in cols:
            if c not in known_columns:
                raise BadRequestError(f"매핑 컬럼이 스키마에 없습니다: {c}")

        ot_prop_names = {p.apiName for p in ot.properties}
        for p in m.properties:
            if p.property not in ot_prop_names:
                raise BadRequestError(
                    f"매핑 '{m.objectTypeApiName}' 의 Property '{p.property}' 가 "
                    f"Object Type 정의를 찾을 수 없습니다."
                )

        for l in m.links:
            lt = await LinkType.find_one(LinkType.apiName == l.linkTypeApiName)
            if not lt:
                raise BadRequestError(f"Link Type '{l.linkTypeApiName}' 이(가) 존재하지 않습니다.")
            if l.direction == "OUT":
                if lt.sourceObjectTypeApiName != m.objectTypeApiName:
                    raise BadRequestError(
                        f"링크 '{l.linkTypeApiName}' 의 source='{lt.sourceObjectTypeApiName}' 인데 "
                        f"이 매핑은 '{m.objectTypeApiName}' 에서 OUT 입니다."
                    )
                if lt.targetObjectTypeApiName != l.target.objectTypeApiName:
                    raise BadRequestError(
                        f"링크 '{l.linkTypeApiName}' 의 target='{lt.targetObjectTypeApiName}' 인데 "
                        f"매핑의 target 은 '{l.target.objectTypeApiName}' 입니다."
                    )
            elif l.direction == "IN":
                if lt.targetObjectTypeApiName != m.objectTypeApiName:
                    raise BadRequestError(
                        f"링크 '{l.linkTypeApiName}' 의 target='{lt.targetObjectTypeApiName}' 인데 "
                        f"이 매핑은 '{m.objectTypeApiName}' 으로 IN 입니다."
                    )
                if lt.sourceObjectTypeApiName != l.target.objectTypeApiName:
                    raise BadRequestError(
                        f"링크 '{l.linkTypeApiName}' 의 source='{lt.sourceObjectTypeApiName}' 인데 "
                        f"매핑의 target 은 '{l.target.objectTypeApiName}' 입니다."
                    )
            else:
                raise BadRequestError(f"지원하지 않는 link.direction: {l.direction}")

            tgt_ot = await ObjectType.find_one(ObjectType.apiName == l.target.objectTypeApiName)
            if not tgt_ot:
                raise BadRequestError(f"링크 타깃 Object Type 이 존재하지 않습니다: {l.target.objectTypeApiName}")
            if l.target.matchProperty not in {p.apiName for p in tgt_ot.properties}:
                raise BadRequestError(
                    f"matchProperty '{l.target.matchProperty}' 가 Object Type "
                    f"'{l.target.objectTypeApiName}' 에 없습니다."
                )


async def update_mappings(
    ds_id: str,
    mappings: list[ObjectMapping],
    stub_on_missing_target: Optional[bool] = None,
) -> DataSource:
    ds = await get_data_source(ds_id)
    await validate_mappings_async(ds, mappings)
    ds.mappings = mappings
    if stub_on_missing_target is not None:
        ds.stubOnMissingTarget = stub_on_missing_target
    await ds.save()
    return ds


# ── Transform ─────────────────────────────────────────────────────────────────
def _default_transform_for_type(data_type_value: str) -> Optional[str]:
    return {
        "integer": "to_int",
        "double": "to_double",
        "boolean": "to_bool",
        "date": "to_date",
        "string": "to_string",
    }.get(data_type_value)


def _apply_transform(value: Any, transform: Optional[str]) -> Any:
    if value in (None, ""):
        return None
    if not transform:
        return value
    try:
        if transform == "to_int":
            return int(value)
        if transform == "to_double":
            return float(value)
        if transform == "to_bool":
            if isinstance(value, bool):
                return value
            s = str(value).strip().lower()
            if s in ("true", "1", "yes"):
                return True
            if s in ("false", "0", "no"):
                return False
            raise ValueError(f"cannot coerce {value!r} to bool")
        if transform == "to_date":
            return str(value)
        if transform == "to_string":
            return str(value)
    except Exception as e:
        raise BadRequestError(f"transform '{transform}' 실패: {value!r} ({e})") from e
    raise BadRequestError(f"unknown transform: {transform}")


# ── 인제스트 ───────────────────────────────────────────────────────────────────
def _make_rid(type_api_name: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9_]", "", type_api_name).lower() or "obj"
    return f"ri.{safe}.{_u.uuid4().hex}"


async def run_ingest(ds_id: str) -> IngestJob:
    ds = await get_data_source(ds_id)
    if not ds.mappings:
        raise BadRequestError("매핑이 정의되지 않은 데이터소스입니다.")

    job = IngestJob(dataSourceId=str(ds.id), status=IngestStatus.RUNNING)
    await job.insert()

    try:
        if ds.kind == "csv":
            _h, rows = await _read_csv(ds.storagePath)
        else:
            _h, rows = await _read_json(ds.storagePath)

        type_cache: dict[str, ObjectType] = {}
        for m in ds.mappings:
            ot = await ObjectType.find_one(ObjectType.apiName == m.objectTypeApiName)
            if not ot:
                raise BadRequestError(f"ObjectType not found: {m.objectTypeApiName}")
            type_cache[m.objectTypeApiName] = ot

        created_nodes = 0
        updated_nodes = 0
        created_links = 0

        for idx, row in enumerate(rows):
            try:
                for m in ds.mappings:
                    ot = type_cache[m.objectTypeApiName]
                    pk_raw = row.get(m.primaryKey.column)
                    if pk_raw in (None, ""):
                        raise BadRequestError(
                            f"primaryKey 컬럼 '{m.primaryKey.column}' 가 비어 있습니다."
                        )

                    pk_prop_name = m.primaryKey.property
                    pk_prop_def = next(p for p in ot.properties if p.apiName == pk_prop_name)
                    pk_value = _apply_transform(
                        pk_raw, _default_transform_for_type(pk_prop_def.dataType.value)
                    )

                    created, updated = await _upsert_node(ot, m, pk_value, row, pk_prop_name)
                    if created:
                        created_nodes += 1
                    elif updated:
                        updated_nodes += 1

                    for link in m.links:
                        link_value_raw = row.get(link.target.matchColumn)
                        if link_value_raw in (None, ""):
                            continue
                        tgt_ot = await ObjectType.find_one(
                            ObjectType.apiName == link.target.objectTypeApiName
                        )
                        if not tgt_ot:
                            raise BadRequestError(
                                f"링크 타깃 ObjectType 누락: {link.target.objectTypeApiName}"
                            )
                        tgt_match_def = next(
                            p for p in tgt_ot.properties if p.apiName == link.target.matchProperty
                        )
                        tgt_value = _apply_transform(
                            link_value_raw, _default_transform_for_type(tgt_match_def.dataType.value)
                        )
                        link_created = await _upsert_link(
                            src_label=ot.apiName,
                            src_pk_prop=pk_prop_name,
                            src_pk_value=pk_value,
                            link=link,
                            tgt_value=tgt_value,
                            stub_on_missing=ds.stubOnMissingTarget,
                        )
                        if link_created:
                            created_links += 1
            except Exception as e:
                job.errorRows.append({"rowIndex": idx, "reason": str(e), "raw": row})

        job.createdNodes = created_nodes
        job.updatedNodes = updated_nodes
        job.createdLinks = created_links
        job.skippedRows = len(job.errorRows)
        job.status = IngestStatus.DONE
        job.finishedAt = datetime.now(timezone.utc)
        await job.save()
        return job
    except Exception as e:
        job.status = IngestStatus.FAILED
        job.errorMessage = str(e)
        job.finishedAt = datetime.now(timezone.utc)
        await job.save()
        raise


async def _upsert_node(
    ot: ObjectType,
    m: ObjectMapping,
    pk_value: Any,
    row: dict,
    pk_prop_name: str,
) -> tuple[bool, bool]:
    """노드 MERGE. (created, updated) 반환.

    - 처음 생성 → (True, False)
    - 이미 존재하지만 속성 SET → (False, True)
    """
    label = ot.apiName
    new_rid = _make_rid(label)

    extra_props: dict[str, Any] = {}
    for mp in m.properties:
        if mp.property == pk_prop_name:
            continue
        v = row.get(mp.column)
        if v in (None, ""):
            continue
        try:
            prop_def = next(p for p in ot.properties if p.apiName == mp.property)
            default_t = _default_transform_for_type(prop_def.dataType.value)
            v2 = _apply_transform(v, mp.transform or default_t)
        except StopIteration:
            continue
        if v2 is not None:
            extra_props[mp.property] = v2

    driver = get_neo4j_driver()
    async with driver.session() as s:
        result = await s.run(
            # label / property name 은 화이트리스트(ObjectType 정의)에서 가져옴.
            f"""
            MERGE (n:`{label}`:`FxObject` {{ `{pk_prop_name}`: $pk }})
            ON CREATE SET
                n._rid = $rid,
                n._typeApiName = $typeApiName,
                n.createdAt = datetime(),
                n.updatedAt = datetime()
            ON MATCH SET
                n.updatedAt = datetime()
            WITH n, (n.createdAt = n.updatedAt) AS isNew
            SET n += $props
            RETURN isNew
            """,
            pk=pk_value,
            rid=new_rid,
            typeApiName=ot.apiName,
            props=extra_props,
        )
        rec = await result.single()
        is_new = bool(rec and rec["isNew"])
        return is_new, not is_new


async def _upsert_link(
    src_label: str,
    src_pk_prop: str,
    src_pk_value: Any,
    link,
    tgt_value: Any,
    stub_on_missing: bool,
) -> bool:
    rel_type = link.linkTypeApiName
    tgt_label = link.target.objectTypeApiName
    tgt_match_prop = link.target.matchProperty

    driver = get_neo4j_driver()
    async with driver.session() as s:
        a = await (
            await s.run(
                f"MATCH (a:`{src_label}`:`FxObject` {{ `{src_pk_prop}`: $srcPk }}) "
                "RETURN a._rid AS rid",
                srcPk=src_pk_value,
            )
        ).single()
        if not a:
            return False
        src_rid = a["rid"]

        if not stub_on_missing:
            tgt_exist = await (
                await s.run(
                    f"MATCH (b:`{tgt_label}`:`FxObject` {{ `{tgt_match_prop}`: $tgtV }}) "
                    "RETURN b._rid AS rid",
                    tgtV=tgt_value,
                )
            ).single()
            if not tgt_exist:
                return False

        cypher = f"""
        MATCH (a:`{src_label}`:`FxObject` {{ _rid: $srcRid }})
        MERGE (b:`{tgt_label}`:`FxObject` {{ `{tgt_match_prop}`: $tgtVal }})
        ON CREATE SET
            b._rid = $bRid,
            b._typeApiName = $tgtLabel,
            b.createdAt = datetime(),
            b.updatedAt = datetime()
        ON MATCH SET
            b.updatedAt = datetime()
        MERGE (a)-[r:`{rel_type}`]->(b)
        ON CREATE SET r.createdAt = datetime()
        RETURN b
        """
        b_rid = _make_rid(tgt_label)
        await s.run(
            cypher,
            srcRid=src_rid,
            tgtVal=tgt_value,
            bRid=b_rid,
            tgtLabel=tgt_label,
        )
        return True
