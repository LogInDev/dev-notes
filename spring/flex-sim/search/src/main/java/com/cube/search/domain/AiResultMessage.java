package com.cube.search.domain;

import java.time.LocalDateTime;

public record AiResultMessage(Long id, Long resultId, Integer seq, String role, String text, String meta, LocalDateTime createdAt) {
}
