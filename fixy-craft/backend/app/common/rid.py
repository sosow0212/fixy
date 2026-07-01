"""_rid 생성/파싱.

`ri.<type>.<uuid7>` 형태로 시스템 내부 식별자를 부여한다.
- type: Object Type apiName (소문자). Phase 4 의 검증 단계에서 쓰기 좋게 안정적.
- uuid7: 시간 정렬 가능한 UUID (권장). 표준 uuid4 도 무방.
"""
from __future__ import annotations

import re
import uuid

from app.common.errors import BadRequestError

# type 은 PascalCase 또는 SCREAMING_SNAKE_CASE 모두 허용 → 소문자 알파벳/숫자/_ 로 정규화
_RID_RE = re.compile(r"^ri\.([a-z0-9_]+)\.([A-Za-z0-9_-]+)$")


def make_rid(object_type_api_name: str) -> str:
    """`ri.person.<uuid>` 생성."""
    type_part = re.sub(r"[^A-Za-z0-9_]", "", object_type_api_name).lower()
    if not type_part:
        raise BadRequestError(f"invalid object type apiName for rid: {object_type_api_name!r}")
    return f"ri.{type_part}.{uuid.uuid4().hex}"


def parse_rid(rid: str) -> tuple[str, str]:
    """(type_part, uuid_part) 반환. 잘못된 형식이면 BadRequestError."""
    m = _RID_RE.match(rid)
    if not m:
        raise BadRequestError(f"invalid _rid format: {rid!r}")
    return m.group(1), m.group(2)
