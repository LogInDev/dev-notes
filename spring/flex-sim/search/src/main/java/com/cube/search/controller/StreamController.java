package com.cube.search.controller;
import com.cube.common.ApiResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/stream")
public class StreamController {
    @GetMapping(value="/results/{resultId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable Long resultId) {
        SseEmitter emitter = new SseEmitter(0L);
        var exec = Executors.newSingleThreadScheduledExecutor();
        // 데모: 10개의 토큰을 50ms 간격으로 전송
        List<String> tokens = List.of("안녕하세요,", " ", "결과를", " ", "설명드릴게요.");
        final int[] idx = {0};
        exec.scheduleAtFixedRate(() -> {
            try {
                if (idx[0] < tokens.size()) {
                    emitter.send(SseEmitter.event().name("chunk").data(tokens.get(idx[0]++)));
                } else {
                    emitter.send(SseEmitter.event().name("done").data("complete"));
                    emitter.complete();
                    exec.shutdown();
                }
            } catch (IOException e) {
                emitter.completeWithError(e);
                exec.shutdown();
            }
        }, 0, 50, TimeUnit.MILLISECONDS);
        return emitter;
    }

    @GetMapping("/ping")
    public ApiResponse<String> ping(){ return ApiResponse.ok("pong"); }
}
