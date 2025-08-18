package com.cube.search.controller;
import com.cube.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/stream")
@RequiredArgsConstructor
public class StreamController {
    private final SearchService service;

    @GetMapping(value="/searches/{queryId}", produces=MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable Long queryId) {
        SseEmitter em = new SseEmitter(0L);
        new Thread(() -> {
            try {
                var header = service.header(queryId);
                if (header == null) { em.send(SseEmitter.event().name("done")); em.complete(); return; }

                // DB에 저장된 메시지(assistant 텍스트)를 하나의 문자열로 합치거나, 이미 토큰/seq로 저장되어있다면 그대로 사용
                var msgs = service.messages(header.id(), null, 10_000).messages();
                String text = msgs.stream()
                        .filter(m -> "assistant".equals(m.role()))
                        .map(m -> m.text())
                        .reduce("", (a,b) -> a + (a.endsWith(" ")? "": " ") + b);

                // 단어 단위(원하면 글자/서브워드로 변경)
                for (String tok : text.split(" ")) {
                    em.send(SseEmitter.event().name("delta").data(tok + " "));
                    Thread.sleep(35); // 타이핑 속도
                }
                em.send(SseEmitter.event().name("done").data("ok"));
                em.complete();
            } catch (Exception e) { try { em.completeWithError(e);} catch (Exception ignore) {} }
        }).start();
        return em;
    }
}
