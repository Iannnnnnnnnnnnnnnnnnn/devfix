package com.devfix.ai.controller;

import com.devfix.ai.dto.ApiResponse;
import com.devfix.ai.dto.HistoryDetailResponse;
import com.devfix.ai.dto.HistoryListResponse;
import com.devfix.ai.service.CliService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/history")
public class HistoryController {
    private final CliService cliService;

    public HistoryController(CliService cliService) {
        this.cliService = cliService;
    }

    @GetMapping("/recent")
    public ApiResponse<HistoryListResponse> recent(@RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.ok(cliService.recentHistory(limit));
    }

    @GetMapping("/{id}")
    public ApiResponse<HistoryDetailResponse> detail(@PathVariable Long id) {
        return ApiResponse.ok(cliService.historyDetail(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        cliService.deleteHistory(id);
        return ApiResponse.ok("已删除", null);
    }
}
