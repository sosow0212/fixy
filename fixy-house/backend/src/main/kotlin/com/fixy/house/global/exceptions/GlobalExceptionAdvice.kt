package com.fixy.house.global.exceptions

import com.fasterxml.jackson.databind.JsonMappingException
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.AuthenticationException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import org.springframework.web.servlet.resource.NoResourceFoundException

/**
 * 전역 예외 처리.
 *
 * 우선순위: CustomException → Spring Security → Validation → JSON → 404 → 500.
 */
@RestControllerAdvice
class GlobalExceptionAdvice {

    private val log = LoggerFactory.getLogger(this::class.java)

    // 1) 비즈니스 예외
    @ExceptionHandler(CustomException::class)
    fun handleCustomException(
        request: HttpServletRequest,
        exception: CustomException
    ): ResponseEntity<ExceptionResponse> {
        val type = exception.getExceptionType()
        log.warn(
            "Custom exception: {} | URI: {} {} | Message: {}",
            type.errorCode, request.method, request.requestURI, exception.message, exception
        )
        return ResponseEntity
            .status(type.httpStatusCode)
            .body(
                ExceptionResponse(
                    name = type::class.simpleName ?: type.errorCode,
                    errorCode = type.errorCode,
                    message = exception.message
                )
            )
    }

    // 2) Spring Security: 인증 실패
    @ExceptionHandler(AuthenticationException::class)
    fun handleAuthenticationException(
        request: HttpServletRequest,
        exception: AuthenticationException
    ): ResponseEntity<ExceptionResponse> {
        log.warn("Authentication failed: {} {} | {}", request.method, request.requestURI, exception.message)
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(
                ExceptionResponse(
                    name = "UNAUTHORIZED",
                    errorCode = "UNAUTHORIZED",
                    message = exception.message ?: "인증에 실패했습니다."
                )
            )
    }

    // 3) Spring Security: 인가 실패
    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDeniedException(
        request: HttpServletRequest,
        exception: AccessDeniedException
    ): ResponseEntity<ExceptionResponse> {
        log.warn("Access denied: {} {} | {}", request.method, request.requestURI, exception.message)
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(
                ExceptionResponse(
                    name = "FORBIDDEN",
                    errorCode = "FORBIDDEN",
                    message = "접근 권한이 없습니다."
                )
            )
    }

    // 4) @Valid 검증 실패
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(
        request: HttpServletRequest,
        exception: MethodArgumentNotValidException
    ): ResponseEntity<ExceptionResponse> {
        log.warn("Validation failed: {} {}", request.method, request.requestURI)
        val errors = exception.bindingResult.fieldErrors
            .joinToString("; ") { "${it.field}: ${it.defaultMessage ?: "유효하지 않음"}" }
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ExceptionResponse(
                    name = "VALIDATION_ERROR",
                    errorCode = "BAD_REQUEST",
                    message = if (errors.isNotBlank()) errors else "요청 파라미터가 유효하지 않습니다."
                )
            )
    }

    // 5) JSON 파싱 실패
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleDeserializationException(
        exception: HttpMessageNotReadableException
    ): ResponseEntity<ExceptionResponse> {
        val message = when (val cause = exception.cause) {
            is JsonMappingException -> {
                when {
                    cause.message?.contains("Required request body is missing") == true ->
                        "요청 본문이 필요합니다."

                    cause.path.isNotEmpty() && cause.message?.contains("null") == true -> {
                        val fieldPath = cause.path.joinToString(".") { it.fieldName }
                        "필수 필드 '$fieldPath'는 null일 수 없습니다."
                    }

                    else -> {
                        val fieldPath = cause.path.joinToString(".") { it.fieldName }
                        "JSON 형식이 올바르지 않습니다. (필드: $fieldPath)"
                    }
                }
            }
            else -> "요청 본문을 읽을 수 없습니다."
        }
        log.warn("Deserialization error: {}", message, exception)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ExceptionResponse(
                    name = "DESERIALIZATION_ERROR",
                    errorCode = "BAD_REQUEST",
                    message = message
                )
            )
    }

    // 6) PathVariable / QueryParam 타입 미스매치
    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleTypeMismatchException(
        exception: MethodArgumentTypeMismatchException
    ): ResponseEntity<ExceptionResponse> {
        val message = "파라미터 '${exception.name}' 의 값 '${exception.value}' 을(를) ${exception.requiredType?.simpleName ?: "요청 타입"} 으로 변환할 수 없습니다."
        log.warn("Type mismatch: {}", message)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ExceptionResponse(
                    name = "TYPE_MISMATCH",
                    errorCode = "BAD_REQUEST",
                    message = message
                )
            )
    }

    // 7) 정적 리소스 없음
    @ExceptionHandler(NoResourceFoundException::class)
    fun handleNoResourceFoundException(
        request: HttpServletRequest,
        exception: NoResourceFoundException
    ): ResponseEntity<ExceptionResponse> {
        log.warn(
            "Resource not found: {} {} | {}",
            request.method, request.requestURI, exception.message
        )
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(
                ExceptionResponse(
                    name = "NOT_FOUND",
                    errorCode = "NOT_FOUND",
                    message = "요청한 경로를 찾을 수 없습니다."
                )
            )
    }

    // 8) 최종 안전망
    @ExceptionHandler(Exception::class)
    fun handleUnexpectedException(
        request: HttpServletRequest,
        exception: Exception
    ): ResponseEntity<ExceptionResponse> {
        log.error(
            "Unexpected error: {} {} | Message: {}",
            request.method, request.requestURI, exception.message, exception
        )
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(
                ExceptionResponse(
                    name = "INTERNAL_SERVER_ERROR",
                    errorCode = "INTERNAL_SERVER_ERROR",
                    message = exception.message ?: "서버 내부 오류가 발생했습니다."
                )
            )
    }
}
