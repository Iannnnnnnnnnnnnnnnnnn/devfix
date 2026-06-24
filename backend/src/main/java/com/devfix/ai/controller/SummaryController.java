package com.devfix.ai.controller;

import com.devfix.ai.dto.ApiResponse;
import com.devfix.ai.dto.SummaryBatchExportFile;
import com.devfix.ai.dto.SummaryBatchExportRequest;
import com.devfix.ai.dto.SummaryDocResponse;
import com.devfix.ai.dto.SummaryExportFile;
import com.devfix.ai.dto.SummaryGenerateRequest;
import com.devfix.ai.dto.SummaryImportPreviewResponse;
import com.devfix.ai.dto.SummaryImportResultResponse;
import com.devfix.ai.service.SummaryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/summary")
public class SummaryController {
    private final SummaryService summaryService;
    private final ObjectMapper objectMapper;

    public SummaryController(SummaryService summaryService,
                             ObjectMapper objectMapper) {
        this.summaryService = summaryService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/commands/generate")
    public ApiResponse<SummaryDocResponse> generateCommandSummary(@Valid @RequestBody SummaryGenerateRequest request) {
        return ApiResponse.ok(summaryService.generateCommandSummary(request.getProjectId(), request.getSceneId()));
    }

    @PostMapping("/logs/generate")
    public ApiResponse<SummaryDocResponse> generateLogSummary(@Valid @RequestBody SummaryGenerateRequest request) {
        return ApiResponse.ok(summaryService.generateLogSummary(request.getProjectId(), request.getSceneId()));
    }

    @GetMapping("/docs")
    public ApiResponse<List<SummaryDocResponse>> listDocs(@RequestParam(required = false) Long projectId,
                                                          @RequestParam(required = false) Long sceneId,
                                                          @RequestParam(required = false, name = "type") String type,
                                                          @RequestParam(required = false) String environment,
                                                          @RequestParam(defaultValue = "1") int page,
                                                          @RequestParam(defaultValue = "20") int pageSize) {
        return ApiResponse.ok(summaryService.listDocs(projectId, sceneId, type, page, pageSize));
    }

    @GetMapping("/docs/{id}")
    public ApiResponse<SummaryDocResponse> detail(@PathVariable Long id) {
        return ApiResponse.ok(summaryService.detail(id));
    }

    @GetMapping("/docs/{id}/export")
    public ResponseEntity<byte[]> exportOne(@PathVariable Long id) throws Exception {
        SummaryExportFile exportFile = summaryService.exportOne(id);
        return jsonAttachment(objectMapper.writeValueAsBytes(exportFile), "devai-summary-" + id + ".devai-summary.json");
    }

    @PostMapping("/docs/export")
    public ResponseEntity<byte[]> exportBatch(@Valid @RequestBody SummaryBatchExportRequest request) throws Exception {
        SummaryBatchExportFile exportFile = summaryService.exportBatch(request.getIds());
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        return jsonAttachment(objectMapper.writeValueAsBytes(exportFile), "devai-summary-batch-" + date + ".devai-summary.json");
    }

    @PostMapping(value = "/docs/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<SummaryImportPreviewResponse> importPreview(@RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(summaryService.importPreview(file));
    }

    @PostMapping(value = "/docs/import/confirm", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<SummaryImportResultResponse> importConfirm(@RequestParam("file") MultipartFile file,
                                                                  @RequestParam Long projectId,
                                                                  @RequestParam Long sceneId,
                                                                  @RequestParam(required = false) String summaryType,
                                                                  @RequestParam(required = false) String environment,
                                                                  @RequestParam(required = false) String title,
                                                                  @RequestParam(required = false) String tags,
                                                                  @RequestParam(defaultValue = "false") boolean allowDuplicate,
                                                                  @RequestParam(defaultValue = "web_import") String importSource) {
        SummaryImportResultResponse result = summaryService.importConfirm(file, projectId, sceneId, summaryType, environment,
                title, tags, allowDuplicate, importSource);
        return ApiResponse.ok("导入成功", result);
    }

    @DeleteMapping("/docs/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        summaryService.deleteDoc(id);
        return ApiResponse.ok("已删除", null);
    }

    private ResponseEntity<byte[]> jsonAttachment(byte[] body, String filename) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(filename, StandardCharsets.UTF_8)
                        .build()
                        .toString())
                .body(body);
    }
}
