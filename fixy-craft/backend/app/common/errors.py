"""도메인 공통 에러 정의. FastAPI 의 HTTPException 으로 변환된다."""
from __future__ import annotations


class DomainError(Exception):
    """도메인 로직의 예외 베이스."""

    status_code: int = 400
    code: str = "domain_error"

    def __init__(self, message: str = ""):
        super().__init__(message)
        self.message = message or self.code


class BadRequestError(DomainError):
    status_code = 400
    code = "bad_request"


class NotFoundError(DomainError):
    status_code = 404
    code = "not_found"


class ConflictError(DomainError):
    """참조 무결성 위반, 중복 등. 409."""
    status_code = 409
    code = "conflict"


class ValidationFailedError(DomainError):
    """Action 파라미터 검증 실패. 422."""
    status_code = 422
    code = "validation_failed"
