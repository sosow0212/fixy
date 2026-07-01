"""Phase 4 — Action engine 테스트 (Neo4j 없이 검증/파라미터 단계까지).

Neo4j 가 필요한 실제 쓰기 검증은 docker compose up 으로 통합 테스트.
본 파일은 검증 로직의 단위 테스트.
"""
from __future__ import annotations

import pytest

from app.actions.engine import _coerce, validate_parameters
from app.actions.models import ParameterDef
from app.common.errors import ValidationFailedError


def test_string_coerce():
    assert _coerce("abc", "string") == "abc"
    assert _coerce(123, "string") == "123"


def test_int_coerce():
    assert _coerce("10", "integer") == 10
    with pytest.raises(ValidationFailedError):
        _coerce("not-a-number", "integer")


def test_objectRid_validation():
    assert _coerce("ri.person.abc123", "objectRid") == "ri.person.abc123"
    with pytest.raises(ValidationFailedError):
        _coerce("not-a-rid", "objectRid")
    with pytest.raises(ValidationFailedError):
        _coerce(12345, "objectRid")


def test_validate_parameters_required_and_allowed():
    defs = [
        ParameterDef(name="targetRid", type="objectRid", required=True),
        ParameterDef(
            name="newRole",
            type="string",
            required=True,
            allowed=["Engineer", "Designer"],
        ),
    ]
    out = validate_parameters(
        defs,
        {"targetRid": "ri.person.x", "newRole": "Engineer"},
    )
    assert out == {"targetRid": "ri.person.x", "newRole": "Engineer"}


def test_validate_parameters_allowed_violation():
    defs = [
        ParameterDef(name="newRole", type="string", required=True, allowed=["Engineer"]),
    ]
    with pytest.raises(ValidationFailedError):
        validate_parameters(defs, {"newRole": "Other"})


def test_validate_parameters_missing_required():
    defs = [ParameterDef(name="x", type="string", required=True)]
    with pytest.raises(ValidationFailedError):
        validate_parameters(defs, {})


def test_validate_parameters_extra_key_rejected():
    defs = [ParameterDef(name="x", type="string", required=True)]
    with pytest.raises(ValidationFailedError):
        validate_parameters(defs, {"x": "ok", "extra": 1})
