package com.cube.search.domain;

import java.util.List;

public record MessagesPage(
        List<AiResultMessage> messages,
        Integer nextCursorSeq
) {
}
