package com.cube.search.api.payload;

import com.cube.search.domain.SearchQuery;
import lombok.Data;

import java.util.List;

@Data
public class SearchHistoryPage {
    private List<SearchQuery> items;
    private String nextCursor;
}
