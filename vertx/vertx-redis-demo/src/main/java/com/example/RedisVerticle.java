package com.example;

import io.vertx.core.AbstractVerticle;
import io.vertx.redis.client.Redis;
import io.vertx.redis.client.RedisAPI;
import io.vertx.redis.client.RedisOptions;

import java.util.Arrays;

public class RedisVerticle extends AbstractVerticle {
    @Override
    public void start() throws Exception {
        final RedisOptions options = new RedisOptions()
                .setConnectionString("redis://localhost:6379");

        final Redis redisClient = Redis.createClient(vertx, options);
        final RedisAPI redis = RedisAPI.api(redisClient);

        // 값 저장
        redis.set(Arrays.asList("mykey", "Hello Redis!"))
                .onSuccess(res -> {
                    System.out.println("✅ Set 성공 : " + res.toString());

                    // 값 조회
                    redis.get("mykey")
                            .onSuccess(val -> {
                                System.out.println("📦 Get 결과: " + val.toString());
                            })
                            .onFailure(err -> {
                                System.out.println("❌ Get 실패 : " + err.getMessage());
                            });
                })
                .onFailure(err -> {
                    System.out.println("❌ Set 실패 : " + err.getMessage());
                });
    }
}
