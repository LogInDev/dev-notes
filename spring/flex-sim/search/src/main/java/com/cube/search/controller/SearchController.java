package com.cube.search.controller;

import com.cube.common.ApiResponse;
import com.cube.search.api.payload.ResultPayload;
import com.cube.search.api.payload.SearchHistoryPage;
import com.cube.search.domain.AiResult;
import com.cube.search.domain.CursorPage;
import com.cube.search.domain.MessagesPage;
import com.cube.search.domain.SearchQuery;
import com.cube.search.service.SearchService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SearchController {
    private final SearchService service;

    @GetMapping("/searches")
    public ApiResponse<CursorPage<SearchQuery>> history(
            @RequestParam(required=false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime cursorCreatedAt,
            @RequestParam(required=false) Long cursorId,
            @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(service.history(cursorCreatedAt, cursorId, size));
    }

    @GetMapping("/searches/{queryId}/result/header")
    public ApiResponse<AiResult> header(@PathVariable Long queryId){
        return ApiResponse.ok(service.header(queryId));
    }

    @GetMapping("/searches/{queryId}/result/messages")
    public ApiResponse<MessagesPage> messages(
            @PathVariable Long queryId,
            @RequestParam(required=false) Integer cursorSeq,
            @RequestParam(defaultValue="100") int size){
        AiResult head = service.header(queryId);
        if (head == null) return ApiResponse.ok(new MessagesPage(java.util.List.of(), null));
        return ApiResponse.ok(service.messages(head.id(), cursorSeq, size));
    }
}
