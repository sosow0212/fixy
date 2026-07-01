"""Objects (조회) 도메인 service — Cypher 쿼리 빌더.

(중요 — AGENTS.md) 모든 Cypher 는 라벨 / 관계 타입 / property name 같은 구조 요소를
화이트리스트(ObjectType/LinkType 정의)에서 가져온다. 사용자 입력은 $ 파라미터 바인딩만.

조회는 전부 read-only. 데이터 변경은 여기서 하지 않는다.
"""
from __future__ import annotations

from typing import Any, Optional

from app.common.errors import BadRequestError, NotFoundError
from app.config import settings
from app.db.neo4j import get_neo4j_driver
from app.objects.schemas import (
    GraphNode,
    GraphSearchHit,
    GraphView,
    ObjectDetail,
    ObjectSet,
    ObjectSummary,
    RelatedEdge,
    RelatedNode,
)
from app.ontology.models import LinkType, ObjectType


# ── 안전한 라벨/속성 이스케이프 ────────────────────────────────────────────────
def _safe_label(label: str) -> str:
    """Object Type apiName 을 라벨로 쓸 때 검증. PascalCase 만 허용."""
    import re

    if not re.match(r"^[A-Z][A-Za-z0-9]*$", label):
        raise BadRequestError(f"invalid label: {label}")
    return f"`{label}`"


def _safe_rel(rel: str) -> str:
    """Link Type apiName 은 SCREAMING_SNAKE_CASE."""
    import re

    if not re.match(r"^[A-Z][A-Z0-9_]*$", rel):
        raise BadRequestError(f"invalid relationship type: {rel}")
    return f"`{rel}`"


def _safe_prop(prop: str) -> str:
    """Property apiName 은 camelCase (혹은 _rid/_typeApiName 등 시스템 정의)."""
    import re

    if not re.match(r"^[a-zA-Z_][A-Za-z0-9_]*$", prop):
        raise BadRequestError(f"invalid property name: {prop}")
    return f"`{prop}`"


# ── Object Type 조회 헬퍼 ─────────────────────────────────────────────────────
async def _get_object_type(api_name: str) -> ObjectType:
    ot = await ObjectType.find_one(ObjectType.apiName == api_name)
    if not ot:
        raise NotFoundError(f"ObjectType not found: {api_name}")
    return ot


# ── Object Set ────────────────────────────────────────────────────────────────
async def list_objects(
    type_api_name: str,
    property_filter: Optional[dict[str, Any]] = None,
    limit: int = 50,
    offset: int = 0,
    sort_property: Optional[str] = None,
    sort_direction: str = "ASC",
) -> ObjectSet:
    ot = await _get_object_type(type_api_name)
    label = _safe_label(ot.apiName)

    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    # 동적 SET WHERE 는 property 검증 후 f-string 으로 조립, 값은 $ 파라미터.
    where_clauses: list[str] = ["n._typeApiName = $typeApi"]
    params: dict[str, Any] = {"typeApi": ot.apiName, "skip": offset, "lim": limit}

    if property_filter:
        for i, (pname, value) in enumerate(property_filter.items()):
            if pname not in {p.apiName for p in ot.properties}:
                raise BadRequestError(f"unknown property: {pname}")
            # eq 검색 (단순). (추측) contains 검색은 추가 구현.
            where_clauses.append(f"n.{_safe_prop(pname)} = $p{i}")
            params[f"p{i}"] = value

    where = " AND ".join(where_clauses)
    order = ""
    if sort_property:
        if sort_property not in {p.apiName for p in ot.properties}:
            raise BadRequestError(f"unknown sort property: {sort_property}")
        d = "DESC" if sort_direction.upper() == "DESC" else "ASC"
        order = f"ORDER BY n.{_safe_prop(sort_property)} {d}"

    # title property 자동 노출
    title_prop = next((p.apiName for p in ot.properties if p.isTitle), None)
    return_props = (
        ["n._rid AS rid", "n._typeApiName AS typeApiName"]
        + ([f"n.{_safe_prop(title_prop)} AS title"] if title_prop else [])
        + [f"n.{_safe_prop(p.apiName)} AS `{p.apiName}`" for p in ot.properties]
    )
    select = ", ".join(return_props)

    cypher = (
        f"MATCH (n:{label}:`FxObject`) "
        f"WHERE {where} "
        f"{order} "
        f"RETURN {select} "
        f"SKIP $skip LIMIT $lim"
    )

    total_cypher = f"MATCH (n:{label}:`FxObject`) WHERE {where} RETURN count(n) AS t"

    driver = get_neo4j_driver()
    async with driver.session() as s:
        rows = await s.run(cypher, **params)
        data = [r.data() async for r in rows]
        total_rec = await (await s.run(total_cypher, **params)).single()
        total = int(total_rec["t"]) if total_rec else 0

    items: list[ObjectSummary] = []
    for d in data:
        rid = d.pop("rid")
        type_apiname = d.pop("typeApiName")
        title = d.pop("title", None) if title_prop else None
        properties = {k: v for k, v in d.items()}
        items.append(
            ObjectSummary(
                rid=rid,
                typeApiName=type_apiname,
                title=title,
                properties=properties,
            )
        )

    return ObjectSet(items=items, total=total, limit=limit, offset=offset)


# ── 단일 객체 + 링크 카운트 ──────────────────────────────────────────────────
async def get_object(type_api_name: str, rid: str) -> ObjectDetail:
    ot = await _get_object_type(type_api_name)
    label = _safe_label(ot.apiName)

    driver = get_neo4j_driver()
    async with driver.session() as s:
        rec = await (
            await s.run(
                f"MATCH (n:{label}:`FxObject` {{ _rid: $rid }}) RETURN n",
                rid=rid,
            )
        ).single()
        if not rec:
            raise NotFoundError(f"Object not found: {rid}")
        node = rec["n"]
        node_props = dict(node)

        # 링크 카운트 (방향별)
        counts_rec = await (
            await s.run(
                f"""
                MATCH (n:{label}:`FxObject` {{ _rid: $rid }})
                OPTIONAL MATCH (n)-[r]->(m)
                WITH n, collect({{ type: type(r), dir: 'OUT' }}) AS outRels
                OPTIONAL MATCH (m2)-[r2]->(n)
                WITH n, outRels, collect({{ type: type(r2), dir: 'IN' }}) AS inRels
                RETURN outRels + inRels AS allRels
                """,
                rid=rid,
            )
        ).single()
        all_rels = (counts_rec["allRels"] if counts_rec else []) or []
        # 안전: dict 변환 (실패 케이스)
        from collections import Counter

        cnt = Counter()
        for r in all_rels:
            cnt[(r["type"], r["dir"])] += 1

        link_counts = [
            {"linkTypeApiName": t, "direction": d, "count": c}
            for (t, d), c in sorted(cnt.items())
        ]

    props = {k: v for k, v in node_props.items()}
    return ObjectDetail(
        rid=props.pop("_rid"),
        typeApiName=props.pop("_typeApiName"),
        properties=props,
        linkCounts=link_counts,
    )


# ── 연결 객체 ────────────────────────────────────────────────────────────────
async def list_related_objects(
    type_api_name: str,
    rid: str,
    link_type: Optional[str] = None,
    direction: str = "OUT",
    limit: int = 100,
) -> list[RelatedNode]:
    ot = await _get_object_type(type_api_name)
    label = _safe_label(ot.apiName)
    limit = max(1, min(limit, 500))
    direction = direction.upper()
    if direction not in ("IN", "OUT"):
        raise BadRequestError("direction 은 IN 또는 OUT 이어야 합니다.")

    if link_type:
        if not await LinkType.find_one(LinkType.apiName == link_type):
            raise NotFoundError(f"LinkType not found: {link_type}")
        rel = _safe_rel(link_type)

        if direction == "OUT":
            cypher = (
                f"MATCH (n:{label}:`FxObject` {{ _rid: $rid }})"
                f"-[r:{rel}]->(m) "
                f"RETURN m LIMIT $lim"
            )
        else:
            cypher = (
                f"MATCH (m)-[r:{rel}]->(n:{label}:`FxObject` {{ _rid: $rid }}) "
                f"RETURN m LIMIT $lim"
            )
    else:
        if direction == "OUT":
            cypher = (
                f"MATCH (n:{label}:`FxObject` {{ _rid: $rid }})"
                f"-[r]->(m) "
                f"RETURN m LIMIT $lim"
            )
        else:
            cypher = (
                f"MATCH (m)-[r]->(n:{label}:`FxObject` {{ _rid: $rid }}) "
                f"RETURN m LIMIT $lim"
            )

    driver = get_neo4j_driver()
    async with driver.session() as s:
        rows = await s.run(cypher, rid=rid, lim=limit)
        nodes = []
        async for r in rows:
            m = r["m"]
            d = dict(m)
            target_type = d.get("_typeApiName", "")
            # title 추출
            tgt_ot = await ObjectType.find_one(ObjectType.apiName == target_type)
            title = None
            if tgt_ot:
                tp = next((p.apiName for p in tgt_ot.properties if p.isTitle), None)
                if tp:
                    title = d.get(tp)
            nodes.append(
                RelatedNode(
                    rid=d.get("_rid"),
                    typeApiName=target_type,
                    title=title,
                    properties={k: v for k, v in d.items() if not k.startswith("_")},
                )
            )
    return nodes


# ── N-hop 그래프 확장 ────────────────────────────────────────────────────────
async def expand_graph(
    start_rid: str,
    depth: int = 1,
    link_types: Optional[list[str]] = None,
) -> GraphView:
    depth = max(1, min(depth, settings.graph_max_depth))
    max_nodes = settings.graph_max_nodes

    # link_type 화이트리스트 검증
    safe_link_types: list[str] = []
    if link_types:
        for lt_name in link_types:
            if not await LinkType.find_one(LinkType.apiName == lt_name):
                raise NotFoundError(f"LinkType not found: {lt_name}")
            safe_link_types.append(_safe_rel(lt_name))
    rel_pattern = "|".join(safe_link_types) if safe_link_types else ""

    # depth 별 표현
    rel_part = f"[r:{rel_pattern}*1..{depth}]" if rel_pattern else f"[r*1..{depth}]"
    path_part = f"-[r:{rel_pattern}*1..{depth}]-" if rel_pattern else f"-[r*1..{depth}]-"

    driver = get_neo4j_driver()
    async with driver.session() as s:
        # 노드 집합
        path_cypher = (
            f"MATCH p = (a:`FxObject` {{ _rid: $startRid }}){path_part}(b:`FxObject`) "
            f"RETURN nodes(p) AS nodes, relationships(p) AS rels LIMIT $maxN"
        )
        path_recs = await s.run(path_cypher, startRid=start_rid, maxN=max_nodes)
        nodes_set: dict[str, GraphNode] = {}
        edges: list[GraphEdge] = []
        async for r in path_recs:
            ns = r["nodes"]
            rs = r["rels"]
            for n in ns:
                d = dict(n)
                rid = d.get("_rid")
                if not rid:
                    continue
                if rid not in nodes_set:
                    # title
                    t = d.get("_typeApiName")
                    title_prop_name: Optional[str] = None
                    ot = await ObjectType.find_one(ObjectType.apiName == t)
                    if ot:
                        tp = next((p.apiName for p in ot.properties if p.isTitle), None)
                        title_prop_name = tp
                    nodes_set[rid] = GraphNode(
                        id=rid,
                        type=t or "Unknown",
                        title=d.get(title_prop_name) if title_prop_name else None,
                    )
            for rel in rs:
                sd = dict(rel.start_node)
                ed = dict(rel.end_node)
                s_rid = sd.get("_rid")
                e_rid = ed.get("_rid")
                edges.append(
                    GraphEdge(source=s_rid, target=e_rid, type=rel.type)
                )
            if len(nodes_set) >= max_nodes:
                break

    return GraphView(nodes=list(nodes_set.values()), edges=edges)


# ── 전역 텍스트 검색 ────────────────────────────────────────────────────────
async def search_graph(query: str, limit: int = 50) -> list[GraphSearchHit]:
    limit = max(1, min(limit, 200))
    # (추측) 모든 title 속성에 대해 텍스트 매칭.
    # ObjectType 의 모든 isTitle/isPrimaryKey/string Property 를 모아 Cypher 로 확인.
    ots = await ObjectType.find_all().to_list()
    hits: list[GraphSearchHit] = []

    # 너무 폭발적이면 like 는 사용하지 않고 개별 MATCH 를 union 으로 쌓는다 (각 ObjectType 별).
    driver = get_neo4j_driver()
    async with driver.session() as s:
        for ot in ots:
            label = _safe_label(ot.apiName)
            # 검색 대상 property: isTitle, 또는 string type
            targets = [p.apiName for p in ot.properties if p.isTitle or p.dataType.value == "string"]
            for prop in targets:
                cypher = (
                    f"MATCH (n:{label}:`FxObject`) "
                    f"WHERE toLower(toString(n.{_safe_prop(prop)})) CONTAINS toLower($q) "
                    f"RETURN n._rid AS rid, n.`{prop}` AS v LIMIT $lim"
                )
                rows = await s.run(cypher, q=query, lim=limit)
                async for r in rows:
                    hits.append(
                        GraphSearchHit(
                            rid=r["rid"],
                            typeApiName=ot.apiName,
                            matchedProperty=prop,
                            matchedValue=r["v"],
                        )
                    )
                    if len(hits) >= limit:
                        return hits
    return hits
