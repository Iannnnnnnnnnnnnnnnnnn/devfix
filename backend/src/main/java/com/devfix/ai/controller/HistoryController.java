package com.devfix.ai.controller;

import com.devfix.ai.dto.ApiResponse;
import com.devfix.ai.dto.CommandHistoryResponse;
import com.devfix.ai.dto.HistoryDetailResponse;
import com.devfix.ai.dto.HistoryListResponse;
import com.devfix.ai.dto.LogHistoryResponse;
import com.devfix.ai.service.CliService;
import com.devfix.ai.service.DevaiHistoryService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/history")
public class HistoryController {
    private final CliService cliService;
    private final DevaiHistoryService devaiHistoryService;

    public HistoryController(CliService cliService,
                             DevaiHistoryService devaiHistoryService) {
        this.cliService = cliService;
        this.devaiHistoryService = devaiHistoryService;
    }

    @GetMapping("/recent")
    public ApiResponse<HistoryListResponse> recent(@RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.ok(cliService.recentHistory(limit));
    }

    @GetMapping("/logs")
    public ApiResponse<List<LogHistoryResponse>> logs(@RequestParam(required = false) Long projectId,
                                                      @RequestParam(required = false) Long sceneId,
                                                      @RequestParam(required = false) String errorType,
                                                      @RequestParam(required = false) String keyword,
                                                      @RequestParam(required = false)
                                                      @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                                      LocalDateTime startTime,
                                                      @RequestParam(required = false)
                                                      @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                                      LocalDateTime endTime,
                                                      @RequestParam(defaultValue = "1") int page,
                                                      @RequestParam(defaultValue = "20") int pageSize) {
        return ApiResponse.ok(devaiHistoryService.queryLogs(projectId, sceneId, errorType, keyword, startTime, endTime, page, pageSize));
    }

    @GetMapping("/commands")
    public ApiResponse<List<CommandHistoryResponse>> commands(@RequestParam(required = false) Long projectId,
                                                              @RequestParam(required = false) Long sceneId,
                                                              @RequestParam(required = false) String environment,
                                                              @RequestParam(required = false) String keyword,
                                                              @RequestParam(required = false)
                                                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                                              LocalDateTime startTime,
                                                              @RequestParam(required = false)
                                                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                                              LocalDateTime endTime,
                                                              @RequestParam(defaultValue = "1") int page,
                                                              @RequestParam(defaultValue = "20") int pageSize) {
        return ApiResponse.ok(devaiHistoryService.queryCommands(projectId, sceneId, keyword, startTime, endTime, page, pageSize));
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
