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
    List<SearchQuery> selectHistoryByCursor(@Param("userId") Long userId,
                                            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
                                            @Param("cursorId") Long cursorId,
                                            @Param("size") int size);

    int insertSearch(SearchQuery query);

    AiResult selectResultHeader(@Param("queryId") Long queryId);

    List<AiResultMessage> selectMessageByResult(@Param("resultId") Long resultId,
                                                @Param("cursorSeq") Integer cursorSeq,
                                                @Param("size") int size);
}
