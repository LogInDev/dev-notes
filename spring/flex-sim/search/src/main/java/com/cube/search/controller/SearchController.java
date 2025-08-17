package com.cube.search.controller;

import com.cube.common.ApiResponse;
import com.cube.search.domain.CursorPage;
import com.cube.search.domain.SearchQuery;
import com.cube.search.service.SearchService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SearchController {
    private final SearchService searchService;

    @PostMapping("/searches")
    public ApiResponse<Long> create(@RequestParam @NotBlank String keyword,
                                    @RequestParam(defaultValue = "1") Long userId) {
        return ApiResponse.ok(searchService.createSearch(userId, keyword));
    }

    @GetMapping("/searches")
    public ApiResponse<CursorPage<SearchQuery>> history(@RequestParam(defaultValue = "1") Long userId,
                                                        @RequestParam(required = false) String cursor,
                                                        @RequestParam(defaultValue = "20") @Min(1) @Max(100) Integer size) {
        return ApiResponse.ok(searchService.getHistory(userId, cursor, size));
    }

    @GetMapping("/searches/{queryId}/result")
    public ApiResponse<SearchService.ResultBundle> result(@PathVariable Long queryId,
                                                          @RequestParam(required = false) Integer fromSeq,
                                                          @RequestParam(defaultValue = "100") Integer size) {
        return ApiResponse.ok(searchService.getResult(queryId, fromSeq, size));
    }
}
