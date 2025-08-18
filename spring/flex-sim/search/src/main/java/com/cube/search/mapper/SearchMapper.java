package com.cube.search.mapper;

import com.cube.search.domain.AiResult;
import com.cube.search.domain.AiResultMessage;
import com.cube.search.domain.SearchQuery;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface SearchMapper {

    // 히스토리 커서 페이징 (created_at DESC, id DESC)
    List<SearchQuery> selectHistoryByCursor(
            @Param("userId") Long userId,
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt, // null 허용
            @Param("cursorId") Long cursorId,                        // null 허용
            @Param("size") int size
    );

    // 검색어 저장 (XML에 존재)
    int insertSearch(SearchQuery query);

    // 결과 헤더(최신 1건)
    AiResult selectResultHeader(@Param("queryId") Long queryId);

    // 결과 메시지 페이징 (seq ASC, cursorSeq 이후)
    List<AiResultMessage> selectMessageByResult(
            @Param("resultId") Long resultId,
            @Param("cursorSeq") Integer cursorSeq, // null이면 처음부터
            @Param("size") int size
    );
}