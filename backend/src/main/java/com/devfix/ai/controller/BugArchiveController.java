package com.devfix.ai.controller;

import com.devfix.ai.dto.ApiResponse;
import com.devfix.ai.dto.BugIssueCreateRequest;
import com.devfix.ai.dto.BugIssueListResponse;
import com.devfix.ai.dto.BugIssueResponse;
import com.devfix.ai.dto.BugIssueTypeResponse;
import com.devfix.ai.dto.BugIssueUpdateRequest;
import com.devfix.ai.dto.BugRecordIdResponse;
import com.devfix.ai.dto.BugRecordSaveRequest;
import com.devfix.ai.dto.BugRecordSummarizeRequest;
import com.devfix.ai.dto.BugRecordSummarizeResponse;
import com.devfix.ai.dto.BugSearchResponse;
import com.devfix.ai.service.BugArchiveService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bug")
public class BugArchiveController {
    private final BugArchiveService bugArchiveService;

    public BugArchiveController(BugArchiveService bugArchiveService) {
        this.bugArchiveService = bugArchiveService;
    }

    @PostMapping("/issues")
    public ApiResponse<BugRecordIdResponse> createIssue(@Valid @RequestBody BugIssueCreateRequest request) {
        return ApiResponse.ok(bugArchiveService.createIssue(request));
    }

    @GetMapping("/issues")
    public ApiResponse<BugIssueListResponse> listIssues(@RequestParam(required = false) Long projectId,
                                                        @RequestParam(required = false) Long sceneId,
                                                        @RequestParam(required = false) String issueName,
                                                        @RequestParam(required = false) String keyword,
                                                        @RequestParam(required = false) String status,
                                                        @RequestParam(required = false) String errorType,
                                                        @RequestParam(required = false) String tag,
                                                        @RequestParam(defaultValue = "1") int page,
                                                        @RequestParam(defaultValue = "20") int pageSize) {
        return ApiResponse.ok(bugArchiveService.listIssues(projectId, sceneId, issueName, keyword, status, errorType, tag, page, pageSize));
    }

    @GetMapping("/issues/{id}")
    public ApiResponse<BugIssueResponse> detail(@PathVariable Long id) {
        return ApiResponse.ok(bugArchiveService.detail(id));
    }

    @GetMapping("/issue-types")
    public ApiResponse<List<BugIssueTypeResponse>> issueTypes(@RequestParam(required = false) Long projectId,
                                                              @RequestParam(required = false) Long sceneId) {
        return ApiResponse.ok(bugArchiveService.issueTypes(projectId, sceneId));
    }

    @PutMapping("/issues/{id}")
    public ApiResponse<BugIssueResponse> updateIssue(@PathVariable Long id,
                                                     @RequestBody BugIssueUpdateRequest request) {
        return ApiResponse.ok(bugArchiveService.updateIssue(id, request));
    }

    @DeleteMapping("/issues/{id}")
    public ApiResponse<Void> deleteIssue(@PathVariable Long id) {
        bugArchiveService.deleteIssue(id);
        return ApiResponse.ok("已删除", null);
    }

    @PostMapping("/investigations/summarize")
    public ApiResponse<BugRecordSummarizeResponse> summarize(@Valid @RequestBody BugRecordSummarizeRequest request) {
        return ApiResponse.ok(bugArchiveService.summarize(request.getProjectId(), request.getIssueId(), request.getRawContent()));
    }

    @PostMapping("/investigations")
    public ApiResponse<BugRecordIdResponse> saveRecord(@Valid @RequestBody BugRecordSaveRequest request) {
        return ApiResponse.ok(bugArchiveService.saveRecord(request));
    }

    @DeleteMapping("/investigations/{id}")
    public ApiResponse<Void> deleteRecord(@PathVariable Long id) {
        bugArchiveService.deleteRecord(id);
        return ApiResponse.ok("已删除", null);
    }

    @GetMapping("/search")
    public ApiResponse<BugSearchResponse> search(@RequestParam(required = false) Long projectId,
                                                 @RequestParam(required = false) Long sceneId,
                                                 @RequestParam(required = false) String issueName,
                                                 @RequestParam(required = false) String keyword,
                                                 @RequestParam(required = false) String status,
                                                 @RequestParam(required = false) String errorType,
                                                 @RequestParam(required = false) String tag,
                                                 @RequestParam(defaultValue = "1") int page,
                                                 @RequestParam(defaultValue = "20") int pageSize) {
        return ApiResponse.ok(bugArchiveService.search(projectId, sceneId, issueName, keyword, status, errorType, tag, page, pageSize));
    }
}
