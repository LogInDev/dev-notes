package com.example;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;
import io.vertx.redis.client.Redis;
import io.vertx.redis.client.RedisAPI;
import io.vertx.redis.client.RedisOptions;

import java.util.Arrays;

public class RestApiVerticle extends AbstractVerticle {

    private RedisAPI redis;

    @Override
    public void start() throws Exception {
        // Redis 연결
        final RedisOptions options = new RedisOptions().setConnectionString("redis://localhost:6379");
        final Redis redisClient = Redis.createClient(vertx, options);
        this.redis = RedisAPI.api(redisClient);

        // 라우터 생성
        Router router = Router.router(vertx);

        // 1. ping
        router.get("/ping").handler(ctx -> ctx.response().end("pong"));

        // 2. set - POST /set {"key" : "...", "value" : "..."}
        router.post("/set").handler(this::handleSet);

        // 3. get - GET /get/:key
        router.get("/get/:key").handler(this::handleGet);

        // HTTP 서버 실행
        vertx.createHttpServer()
                .requestHandler(router)
                .listen(8080)
                .onSuccess(res -> System.out.println("✅ REST API 서버 실행 중: http://localhost:8080"))
                .onFailure(err -> System.out.println("❌ 서버 실행 실패: " + err.getMessage()));
    }

    private void handleGet(RoutingContext ctx) {
        final String key = ctx.pathParam("key");

        redis.get(key).onSuccess(res -> {
            if (res == null) {
                ctx.response().setStatusCode(404).end("값 없음");
            } else {
                ctx.response().end("값: " + res.toString());
            }
        }).onFailure(err -> {
            ctx.response().setStatusCode(500).end("Redis 조회 실패");
        });
    }

    private void handleSet(RoutingContext ctx) {
        ctx.request().body().onSuccess(body -> {
            final JsonObject json = body.toJsonObject();
            final String key = json.getString("key");
            final String value = json.getString("value");

            redis.set(Arrays.asList(key, value)).onSuccess(res -> {
                ctx.response().end("저장 성공: " + key + " = " + value);
            }).onFailure(err -> {
                ctx.response().setStatusCode(500).end("Redis 저장 실패");
            });
        });
    }
}
