package com.fixy.house.global

import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.mongodb.core.mapping.Field
import java.time.Instant

/**
 * Spring Data Mongo 인프라의 공통 시간 필드.
 * 도메인의 BaseEntity 와 1:1 매핑되며, Entity ↔ POJO 변환 시 그대로 복사된다.
 */
abstract class MongoAuditableEntity {
    @CreatedDate
    @Field(name = "created_at")
    var createdAt: Instant? = null

    @LastModifiedDate
    @Field(name = "updated_at")
    var updatedAt: Instant? = null
}
