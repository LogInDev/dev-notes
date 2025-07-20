package com.example;

import io.vertx.core.Vertx;

public class Main {
    public static void main( String[] args ) {
        Vertx vertx = Vertx.vertx();
//        vertx.deployVerticle(new RedisVerticle());
//        vertx.deployVerticle(new RestApiVerticle());
        vertx.deployVerticle(new WebSocketVerticle());
    }
}
