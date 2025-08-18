package com.cube.search.service;

import com.cube.search.api.payload.ResultPayload;
import com.cube.search.api.payload.SearchHistoryPage;
import com.cube.search.domain.*;
import com.cube.search.mapper.SearchMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {
    private final SearchMapper mapper;

    // 임시: 로그인 연동 전까지 userId=1 고정
    private static final long FIXED_USER = 1L;

    /* =========================================================
       신규 API (권장)
       - 커서: (cursorCreatedAt: LocalDateTime, cursorId: Long)
       - 메시지 커서: cursorSeq: Integer
       ========================================================= */

    // 히스토리 무한 스크롤 (created_at DESC, id DESC)
    public CursorPage<SearchQuery> history(LocalDateTime cursorCreatedAt, Long cursorId, int size) {
        List<SearchQuery> items = mapper.selectHistoryByCursor(FIXED_USER, cursorCreatedAt, cursorId, size);

        LocalDateTime nextAt = null;
        Long nextId = null;
        if (!items.isEmpty()) {
            SearchQuery last = items.get(items.size() - 1);
            nextAt = last.getCreatedAt();
            nextId = last.getId();
        }
        return new CursorPage<>(items, nextAt, nextId);
    }

    // 결과 헤더(최신 1건)
    public AiResult header(Long queryId) {
        return mapper.selectResultHeader(queryId);
    }

    // 결과 메시지 페이지(오른쪽 무한 스크롤)
    public MessagesPage messages(Long resultId, Integer cursorSeq, int size) {
        List<AiResultMessage> list = mapper.selectMessageByResult(resultId, cursorSeq, size);
        Integer next = list.isEmpty() ? null : list.get(list.size() - 1).seq();
        return new MessagesPage(list, next);
    }

    /* =========================================================
       호환용 구 API (이전 컨트롤러/프론트가 여전히 호출할 때만 사용)
       - 문자열 커서 "epochMs,id"
       - 한 번에 결과 전체 조회
       ========================================================= */

    @Deprecated
    public com.cube.search.api.payload.SearchHistoryPage fetchHistory(String cursor, int size) {
        // 문자열 커서를 LDT/ID로 변환하여 신규 history()에 위임
        Long cursorTs = null, cursorId = null;
        if (cursor != null && !cursor.isEmpty()) {
            try {
                String[] p = cursor.split(",");
                cursorTs = Long.parseLong(p[0]);
                cursorId = Long.parseLong(p[1]);
            } catch (Exception ignore) {}
        }
        LocalDateTime cursorCreatedAt = (cursorTs == null) ? null :
                LocalDateTime.ofInstant(Instant.ofEpochMilli(cursorTs), ZoneId.systemDefault());

        CursorPage<SearchQuery> page = history(cursorCreatedAt, cursorId, size);

        // 응답을 구 DTO로 포장
        com.cube.search.api.payload.SearchHistoryPage old = new com.cube.search.api.payload.SearchHistoryPage();
        old.setItems(page.items());
        if (page.nextCursorCreatedAt() != null && page.nextCursorId() != null) {
            long ts = page.nextCursorCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
            old.setNextCursor(ts + "," + page.nextCursorId());
        } else {
            old.setNextCursor(null);
        }
        return old;
    }

    @Deprecated
    public com.cube.search.api.payload.ResultPayload fetchResult(Long queryId) {
        AiResult head = header(queryId);
        com.cube.search.api.payload.ResultPayload p = new com.cube.search.api.payload.ResultPayload();
        if (head == null) {
            p.setHeader(null);
            p.setMessages(List.of());
            return p;
        }
        // 구 방식: 전체 메시지 한 번에(커서 없이)
        MessagesPage mp = messages(head.id(), null, 10_000);
        p.setHeader(head);
        p.setMessages(mp.messages());
        return p;
    }
}
