package com.example;

import io.vertx.core.AbstractVerticle;

public class WebSocketVerticle extends AbstractVerticle {
    @Override
    public void start() throws Exception {
        vertx.createHttpServer()
                .webSocketHandler(socket -> {
                    System.out.println("🔗 클라이언트 연결됨");

                    // 초기 인사
                    socket.writeTextMessage("👋 Welcome!");

                    // 메시지 수신 시 처리
                    socket.textMessageHandler(message -> {
                        System.out.println("📨 받은 메시지: " + message);
                        socket.writeTextMessage("Echo: " + message);
                    });

                    // 연결 종료
                    socket.closeHandler(v -> {
                        System.out.println("❌ 연결 종료");
                    });
                })
                .listen(8081)
                .onSuccess(res -> System.out.println("✅ WebSocket 서버 실행 중: ws://localhost:8081"))
                .onFailure(err -> System.err.println("❌ 서버 실행 실패: " + err.getMessage()));
    }
}
