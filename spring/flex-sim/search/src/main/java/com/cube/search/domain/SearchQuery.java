// com/cube/search/domain/SearchQuery.java
package com.cube.search.domain;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class SearchQuery {
    private Long id;
    private Long userId;
    private String keyword;
    private LocalDateTime createdAt;
}
