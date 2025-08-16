package com.cube.search.domain;

import java.time.LocalDateTime;

public record SearchQuery(Long id, Long userId, String keyword, LocalDateTime createdAt) {}
