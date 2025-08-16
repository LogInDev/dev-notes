package com.cube.search.domain;

import java.time.LocalDateTime;

public record AiResult(Long id, Long queryId, String status, String provider, String modeName, LocalDateTime createAt) {
}
