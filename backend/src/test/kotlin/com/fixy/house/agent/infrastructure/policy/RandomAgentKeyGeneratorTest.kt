package com.fixy.house.agent.infrastructure.policy

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldMatch
import io.kotest.matchers.string.shouldStartWith

class RandomAgentKeyGeneratorTest : DescribeSpec({

    val generator = RandomAgentKeyGenerator()

    describe("generateRawKey") {
        it("fixy_ 접두사로 시작한다") {
            generator.generateRawKey() shouldStartWith "fixy_"
        }

        it("Base64 URL-safe 형식 (no padding) — fixy_ 제외") {
            val raw = generator.generateRawKey()
            val encoded = raw.removePrefix("fixy_")
            encoded shouldMatch Regex("^[A-Za-z0-9_-]+$")
        }

        it("호출할 때마다 다른 키가 생성된다") {
            val a = generator.generateRawKey()
            val b = generator.generateRawKey()
            (a == b) shouldBe false
        }
    }

    describe("lastFourOf") {
        it("마지막 4자리만 반환") {
            generator.lastFourOf("fixy_ABCDEFGHH") shouldBe "FGHH"
        }

        it("4자 미만이면 그대로 반환") {
            generator.lastFourOf("abc") shouldBe "abc"
        }
    }
})
