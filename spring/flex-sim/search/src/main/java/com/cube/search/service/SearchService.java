package com.cube.search.service;

import com.cube.search.domain.AiResult;
import com.cube.search.domain.AiResultMessage;
import com.cube.search.domain.CursorPage;
import com.cube.search.domain.SearchQuery;
import com.cube.search.mapper.SearchMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {
    private final SearchMapper mapper;

    public Long createSearch(Long userId, String keyword) {
        final SearchQuery q = new SearchQuery(null, userId, keyword, null);
        mapper.insertSearch(q);
        return q.getId();
    }

    public CursorPage<SearchQuery> getHistory(Long userId, String cursor, int size) {
        Long cursorId = null;
        LocalDateTime cursorTime = null;
        if (cursor != null && !cursor.isEmpty()) {
            String[] parts = new String(Base64.getDecoder().decode(cursor)).split(":");
            cursorTime = LocalDateTime.parse(parts[0]);
            cursorId = Long.parseLong(parts[1]);
        }
        List<SearchQuery> items = mapper.selectHistoryByCursor(userId, cursorTime, cursorId, size+1);
        boolean hasMore = items.size() > size;
        if(hasMore) items = items.subList(0, size);
        String next = null;
        if(hasMore && !items.isEmpty()){
            SearchQuery last = items.get(items.size()-1);
            next = Base64.getEncoder().encodeToString((last.getCreatedAt()+":"+last.getId()).getBytes());
        }
        return new CursorPage<>(items, next, hasMore);
    }

    public record ResultBundle(AiResult header, List<AiResultMessage> messages){}
    public ResultBundle getResult(Long queryId, Integer fromSeq, int size){
        AiResult header = mapper.selectResultHeader(queryId);
        if(header == null) return new ResultBundle(null, List.of());
        List<AiResultMessage> msgs = mapper.selectMessageByResult(header.id(), fromSeq, size);
        return new ResultBundle(header, msgs);
    }
}
