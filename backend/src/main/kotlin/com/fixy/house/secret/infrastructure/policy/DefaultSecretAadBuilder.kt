package com.fixy.house.secret.infrastructure.policy

import com.fixy.house.secret.domain.policy.SecretAadBuilder
import com.fixy.house.secret.domain.vo.SecretScope
import org.springframework.stereotype.Component

@Component
class DefaultSecretAadBuilder : SecretAadBuilder {
    override fun build(ownerUserId: String, secretKey: String, scope: SecretScope): String =
        "$secretKey:$ownerUserId:${scope.name}"
}
