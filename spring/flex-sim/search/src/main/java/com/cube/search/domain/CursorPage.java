package com.cube.search.domain;

import java.time.LocalDateTime;
import java.util.List;

public record CursorPage<T>(
        List<T> items,
        LocalDateTime nextCursorCreatedAt,
        Long nextCursorId
) {
}
