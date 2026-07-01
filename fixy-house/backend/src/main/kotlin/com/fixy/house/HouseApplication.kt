package com.fixy.house

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.mongodb.config.EnableMongoAuditing
import org.springframework.scheduling.annotation.EnableAsync

@SpringBootApplication
@EnableMongoAuditing
@EnableAsync
class HouseApplication

fun main(args: Array<String>) {
    runApplication<HouseApplication>(*args)
}
