package com.fixy.house.global

import java.time.Instant

/**
 * 모든 도메인 POJO 의 공통 시간 필드.
 * 인프라 어노테이션 없음 — 순수 Kotlin.
 * 영속화 시 infrastructure.entity 의 MongoAuditableEntity 와 매핑한다.
 *
 * 주의: setter 를 public 으로 둔다. MongoAuditableEntity → 도메인 POJO 로 매핑 시
 * entity.createdAt 값을 그대로 도메인에 복사해야 하는데, protected set 으로는
 * 다른 모듈의 entity 가 값을 넣을 수 없다. 도메인 내부 로직이 createdAt 을 변경하지
 * 않도록 컨벤션으로 유지한다 (변경하려면 도메인 메서드를 추가).
 */
abstract class BaseEntity {
    var createdAt: Instant? = null
    var updatedAt: Instant? = null
}
