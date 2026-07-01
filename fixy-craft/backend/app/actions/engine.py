"""Action 실행 엔진.

기능:
- 파라미터 검증 (type / required / allowed)
- rules 를 Neo4j 단일 트랜잭션에서 적용 (setProperty / createLink / deleteLink)
- effects (audit) 실행
- 부분 실패 시 전체 롤백 — Neo4j 트랜잭션 + Mongo audit 는 트랜잭션 끝난 뒤 기록
  (audit 기록 실패는 결과 응답에 노출, 데이터 정합성엔 영향 없음)

(중요 — AGENTS.md) 모든 Cypher 는 라벨 / 타입 / property name 을 ObjectType·LinkType
정의에서 가져오고, 값은 $ 파라미터 바인딩.
"""
from __future__ import annotations

import re
from typing import Any, Optional

from neo4j.exceptions import Neo4jError

from app.actions.models import (
    ActionDefinition,
    AuditLog,
    ParameterDef,
)
from app.common.errors import (
    BadRequestError,
    NotFoundError,
    ValidationFailedError,
)
from app.db.neo4j import get_neo4j_driver
from app.ontology.models import ActionType, LinkType, ObjectType


# ── 안전 식별자 ─────────────────────────────────────────────────────────────
def _safe_ident(s: str, kind: str) -> str:
    if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", s):
        raise BadRequestError(f"invalid {kind}: {s}")
    return f"`{s}`"


# ── 파라미터 검증 ───────────────────────────────────────────────────────────
def _coerce(value: Any, type_str: str) -> Any:
    try:
        if type_str == "objectRid":
            if not isinstance(value, str) or not value.startswith("ri."):
                raise ValueError("objectRid 는 'ri.<type>.<uuid>' 형식이어야 합니다.")
            return value
        if type_str == "string":
            return str(value)
        if type_str == "integer":
            return int(value)
        if type_str == "double":
            return float(value)
        if type_str == "boolean":
            if isinstance(value, bool):
                return value
            s = str(value).lower()
            if s in ("true", "1", "yes"):
                return True
            if s in ("false", "0", "no"):
                return False
            raise ValueError("boolean 변환 실패")
        if type_str == "date":
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(value)):
                raise ValueError("date 는 YYYY-MM-DD 형식")
            return str(value)
    except ValueError as e:
        raise ValidationFailedError(str(e))
    raise ValidationFailedError(f"unknown parameter type: {type_str}")


def validate_parameters(
    parameter_defs: list[ParameterDef],
    params: dict[str, Any],
) -> dict[str, Any]:
    coerced: dict[str, Any] = {}
    for p in parameter_defs:
        if p.name in params:
            value = params[p.name]
            coerced[p.name] = _coerce(value, p.type)
            if p.allowed is not None and coerced[p.name] not in p.allowed:
                raise ValidationFailedError(
                    f"parameter '{p.name}' 값이 allowed 목록에 없습니다: "
                    f"{coerced[p.name]!r} (allowed={p.allowed})"
                )
        elif p.required:
            raise ValidationFailedError(f"필수 parameter 누락: {p.name}")
    extra = set(params.keys()) - {p.name for p in parameter_defs}
    if extra:
        raise ValidationFailedError(f"정의되지 않은 parameter: {sorted(extra)}")
    return coerced


# ── Rule 적용 (트랜잭션 내부) ───────────────────────────────────────────────
async def _run_rule(tx, rule, params: dict[str, Any]) -> None:
    rtype = rule.type

    if rtype == "setProperty":
        if not (rule.objectParam and rule.property and rule.valueParam):
            raise BadRequestError(
                "setProperty rule 에 objectParam/property/valueParam 이 필요합니다."
            )
        object_rid = params.get(rule.objectParam)
        if not isinstance(object_rid, str):
            raise ValidationFailedError(
                f"'{rule.objectParam}' 은 objectRid 문자열이어야 합니다."
            )
        if rule.property in {"_rid", "_typeApiName"}:
            raise BadRequestError("내부 시스템 속성은 직접 SET 할 수 없습니다.")
        prop = _safe_ident(rule.property, "property name")
        value = params.get(rule.valueParam)
        await tx.run(
            f"MATCH (n:`FxObject` {{ _rid: $rid }}) SET n.{prop} = $value RETURN n",
            rid=object_rid,
            value=value,
        )

    elif rtype == "createLink":
        if not (rule.sourceRidParam and rule.targetRidParam and rule.linkTypeApiName):
            raise BadRequestError(
                "createLink rule 에 sourceRidParam/targetRidParam/linkTypeApiName 필요."
            )
        lt = await LinkType.find_one(LinkType.apiName == rule.linkTypeApiName)
        if not lt:
            raise NotFoundError(f"LinkType not found: {rule.linkTypeApiName}")
        src_rid = params.get(rule.sourceRidParam)
        tgt_rid = params.get(rule.targetRidParam)
        if not (isinstance(src_rid, str) and isinstance(tgt_rid, str)):
            raise ValidationFailedError("source/target rid 는 objectRid 문자열이어야 합니다.")
        direction = (rule.direction or "OUT").upper()
        rel = _safe_ident(rule.linkTypeApiName, "link type")
        if direction == "OUT":
            cypher = (
                f"MATCH (a:`FxObject` {{ _rid: $srcRid }}) "
                f"MATCH (b:`FxObject` {{ _rid: $tgtRid }}) "
                f"MERGE (a)-[r:{rel}]->(b) "
                f"ON CREATE SET r.createdAt = datetime() "
                f"RETURN r"
            )
        else:
            cypher = (
                f"MATCH (a:`FxObject` {{ _rid: $srcRid }}) "
                f"MATCH (b:`FxObject` {{ _rid: $tgtRid }}) "
                f"MERGE (b)-[r:{rel}]->(a) "
                f"ON CREATE SET r.createdAt = datetime() "
                f"RETURN r"
            )
        await tx.run(cypher, srcRid=src_rid, tgtRid=tgt_rid)

    elif rtype == "deleteLink":
        if not (rule.sourceRidParam and rule.targetRidParam and rule.linkTypeApiName):
            raise BadRequestError("deleteLink rule 에 source/target/linkTypeApiName 필요.")
        lt = await LinkType.find_one(LinkType.apiName == rule.linkTypeApiName)
        if not lt:
            raise NotFoundError(f"LinkType not found: {rule.linkTypeApiName}")
        src_rid = params.get(rule.sourceRidParam)
        tgt_rid = params.get(rule.targetRidParam)
        if not (isinstance(src_rid, str) and isinstance(tgt_rid, str)):
            raise ValidationFailedError("source/target rid 는 objectRid 문자열이어야 합니다.")
        rel = _safe_ident(rule.linkTypeApiName, "link type")
        await tx.run(
            f"""
            MATCH (a:`FxObject` {{ _rid: $srcRid }})
            MATCH (b:`FxObject` {{ _rid: $tgtRid }})
            OPTIONAL MATCH (a)-[r1:{rel}]->(b) DELETE r1
            OPTIONAL MATCH (b)-[r2:{rel}]->(a) DELETE r2
            """,
            srcRid=src_rid,
            tgtRid=tgt_rid,
        )
    else:
        raise BadRequestError(f"unknown rule type: {rtype}")


# ── 실행 진입점 ─────────────────────────────────────────────────────────────
async def execute_action(
    action_api_name: str,
    parameters: dict[str, Any],
    actor: Optional[str] = "admin",
) -> dict[str, Any]:
    at = await ActionType.find_one(ActionType.apiName == action_api_name)
    if not at:
        raise NotFoundError(f"ActionType not found: {action_api_name}")

    if not await ObjectType.find_one(ObjectType.apiName == at.targetObjectTypeApiName):
        raise NotFoundError(f"Target ObjectType not found: {at.targetObjectTypeApiName}")

    try:
        defn = ActionDefinition.model_validate(at.definition)
    except Exception as e:
        raise BadRequestError(f"invalid action definition: {e}") from e

    # 1) 파라미터 검증/변환
    coerced = validate_parameters(defn.parameters, parameters)

    # 2) rules — Neo4j 단일 트랜잭션
    changed_rid: Optional[str] = None
    driver = get_neo4j_driver()
    try:
        async with driver.session() as session:
            async with session.begin_transaction() as tx:
                for rule in defn.rules:
                    await _run_rule(tx, rule, coerced)
                # 응답에 노출할 rid — 첫 setProperty 의 objectParam 사용
                for rule in defn.rules:
                    if rule.type == "setProperty" and rule.objectParam:
                        rid = coerced.get(rule.objectParam)
                        if isinstance(rid, str):
                            changed_rid = rid
                await tx.commit()
    except Neo4jError as e:
        raise BadRequestError(f"Neo4j 트랜잭션 실패: {e.message}")

    # 3) effects — audit
    audit_recorded = False
    audit_msg: Optional[str] = None
    for eff in defn.effects:
        if eff.type == "audit":
            try:
                audit = AuditLog(
                    actionType=action_api_name,
                    actor=actor or "admin",
                    payload={"parameters": coerced},
                    rid=changed_rid,
                    message=eff.message or "",
                )
                await audit.insert()
                audit_recorded = True
                audit_msg = eff.message
            except Exception as e:
                audit_msg = f"audit 기록 실패: {e}"

    return {
        "changedObjectRid": changed_rid,
        "changedProperties": {},
        "auditRecorded": audit_recorded,
        "message": audit_msg,
    }
