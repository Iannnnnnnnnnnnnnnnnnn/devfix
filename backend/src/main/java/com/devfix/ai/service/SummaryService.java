package com.devfix.ai.service;

import com.devfix.ai.client.DeepSeekClient;
import com.devfix.ai.config.DeepSeekProperties;
import com.devfix.ai.domain.entity.CommandHistory;
import com.devfix.ai.domain.entity.DevaiProject;
import com.devfix.ai.domain.entity.DevaiScene;
import com.devfix.ai.domain.entity.LogAnalysisHistory;
import com.devfix.ai.domain.entity.SummaryDoc;
import com.devfix.ai.dto.SummaryBatchExportFile;
import com.devfix.ai.dto.SummaryDocResponse;
import com.devfix.ai.dto.SummaryExportFile;
import com.devfix.ai.dto.SummaryExportItem;
import com.devfix.ai.dto.SummaryExportProject;
import com.devfix.ai.dto.SummaryExportScene;
import com.devfix.ai.dto.SummaryExportSummary;
import com.devfix.ai.dto.SummaryImportPreviewResponse;
import com.devfix.ai.dto.SummaryImportResultResponse;
import com.devfix.ai.exception.AppException;
import com.devfix.ai.mapper.CommandHistoryMapper;
import com.devfix.ai.mapper.LogAnalysisHistoryMapper;
import com.devfix.ai.mapper.SummaryDocMapper;
import com.devfix.ai.support.PromptTemplates;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

@Service
public class SummaryService {
    private static final int SOURCE_LIMIT = 200;
    private static final long MAX_IMPORT_SIZE = 5L * 1024L * 1024L;
    private static final String FORMAT_SINGLE = "devai-summary-doc";
    private static final String FORMAT_BATCH = "devai-summary-doc-batch";
    private static final String VERSION = "1.0";
    private static final DateTimeFormatter FILE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ProjectService projectService;
    private final SceneService sceneService;
    private final CommandHistoryMapper commandHistoryMapper;
    private final LogAnalysisHistoryMapper logHistoryMapper;
    private final SummaryDocMapper summaryDocMapper;
    private final DeepSeekClient deepSeekClient;
    private final DeepSeekProperties deepSeekProperties;
    private final ObjectMapper objectMapper;

    public SummaryService(ProjectService projectService,
                          SceneService sceneService,
                          CommandHistoryMapper commandHistoryMapper,
                          LogAnalysisHistoryMapper logHistoryMapper,
                          SummaryDocMapper summaryDocMapper,
                          DeepSeekClient deepSeekClient,
                          DeepSeekProperties deepSeekProperties,
                          ObjectMapper objectMapper) {
        this.projectService = projectService;
        this.sceneService = sceneService;
        this.commandHistoryMapper = commandHistoryMapper;
        this.logHistoryMapper = logHistoryMapper;
        this.summaryDocMapper = summaryDocMapper;
        this.deepSeekClient = deepSeekClient;
        this.deepSeekProperties = deepSeekProperties;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SummaryDocResponse generateCommandSummary(Long projectId, Long sceneId) {
        DevaiProject project = projectService.requireProject(projectId);
        DevaiScene scene = sceneId == null ? null : sceneService.requireSceneInProject(projectId, sceneId);
        List<CommandHistory> histories = commandHistoryMapper.findByProjectAndScene(projectId, sceneId, SOURCE_LIMIT);
        if (histories.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "当前项目和场景下暂无可梳理的命令历史");
        }
        String content = deepSeekClient.chatText(PromptTemplates.COMMAND_SUMMARY_SYSTEM,
                buildCommandSummaryPrompt(project, scene, histories));
        SummaryDoc doc = new SummaryDoc();
        doc.setProjectId(projectId);
        doc.setSceneId(sceneId);
        doc.setSummaryType("command");
        doc.setTitle(buildCommandTitle(project.getName(), scene));
        doc.setContent(content);
        doc.setTags("[]");
        doc.setSourceCount(histories.size());
        doc.setSourceIds(toJson(histories.stream().map(CommandHistory::getId).toList()));
        doc.setModelName(deepSeekProperties.getModel());
        doc.setImportSource("ai_generate");
        doc.setContentHash(contentHash(doc.getSummaryType(), doc.getTitle(), doc.getContent()));
        summaryDocMapper.insert(doc);
        return toResponse(summaryDocMapper.findById(doc.getId()));
    }

    @Transactional
    public SummaryDocResponse generateLogSummary(Long projectId, Long sceneId) {
        DevaiProject project = projectService.requireProject(projectId);
        DevaiScene scene = sceneId == null ? null : sceneService.requireSceneInProject(projectId, sceneId);
        List<LogAnalysisHistory> histories = logHistoryMapper.findByProjectAndScene(projectId, sceneId, SOURCE_LIMIT);
        if (histories.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "当前项目和场景下暂无可梳理的日志分析历史");
        }
        String content = deepSeekClient.chatText(PromptTemplates.LOG_SUMMARY_SYSTEM,
                buildLogSummaryPrompt(project, scene, histories));
        SummaryDoc doc = new SummaryDoc();
        doc.setProjectId(projectId);
        doc.setSceneId(sceneId);
        doc.setSummaryType("log_problem");
        doc.setTitle(project.getName() + " " + (scene == null ? "全部场景" : scene.getName()) + " 日志问题整合报告");
        doc.setContent(content);
        doc.setTags("[]");
        doc.setSourceCount(histories.size());
        doc.setSourceIds(toJson(histories.stream().map(LogAnalysisHistory::getId).toList()));
        doc.setModelName(deepSeekProperties.getModel());
        doc.setImportSource("ai_generate");
        doc.setContentHash(contentHash(doc.getSummaryType(), doc.getTitle(), doc.getContent()));
        summaryDocMapper.insert(doc);
        return toResponse(summaryDocMapper.findById(doc.getId()));
    }

    public List<SummaryDocResponse> listDocs(Long projectId, Long sceneId, String type, int page, int pageSize) {
        int limit = Math.max(1, Math.min(pageSize, 100));
        int offset = Math.max(0, page - 1) * limit;
        return summaryDocMapper.findPage(projectId, sceneId, type, null, limit, offset)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public SummaryDocResponse detail(Long id) {
        SummaryDoc doc = summaryDocMapper.findById(id);
        if (doc == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "总结文档不存在");
        }
        return toResponse(doc);
    }

    public SummaryExportFile exportOne(Long id) {
        SummaryDoc doc = requireDoc(id);
        DevaiProject project = projectService.requireProject(doc.getProjectId());
        SummaryExportFile file = new SummaryExportFile();
        file.setExportedAt(nowText());
        file.setProject(toExportProject(project));
        file.setScene(toExportScene(doc.getSceneId()));
        file.setSummary(toExportSummary(doc));
        return file;
    }

    public SummaryBatchExportFile exportBatch(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "ids 不能为空");
        }
        List<SummaryDoc> docs = summaryDocMapper.findByIds(ids);
        if (docs.isEmpty()) {
            throw new AppException(HttpStatus.NOT_FOUND, "未找到可导出的总结文档");
        }
        SummaryBatchExportFile file = new SummaryBatchExportFile();
        file.setExportedAt(nowText());
        file.setItems(docs.stream().map(doc -> {
            DevaiProject project = projectService.requireProject(doc.getProjectId());
            SummaryExportItem item = new SummaryExportItem();
            item.setProject(toExportProject(project));
            item.setScene(toExportScene(doc.getSceneId()));
            item.setSummary(toExportSummary(doc));
            return item;
        }).toList());
        return file;
    }

    public SummaryImportPreviewResponse importPreview(MultipartFile file) {
        ParsedSummaryFile parsed = parseImportFile(file);
        SummaryImportPreviewResponse response = new SummaryImportPreviewResponse();
        response.setFormat(parsed.format());
        response.setVersion(parsed.version());
        response.setAvailableProjects(projectService.listProjects());
        if (FORMAT_SINGLE.equals(parsed.format())) {
            SummaryExportFile single = (SummaryExportFile) parsed.payload();
            response.setProjectInFile(single.getProject());
            response.setSceneInFile(single.getScene());
            response.setSummaryInFile(single.getSummary());
        } else {
            SummaryBatchExportFile batch = (SummaryBatchExportFile) parsed.payload();
            response.setItems(batch.getItems().stream()
                    .map(SummaryExportItem::getSummary)
                    .toList());
            if (!batch.getItems().isEmpty()) {
                response.setProjectInFile(batch.getItems().get(0).getProject());
                response.setSceneInFile(batch.getItems().get(0).getScene());
                response.setSummaryInFile(batch.getItems().get(0).getSummary());
            }
        }
        return response;
    }

    @Transactional
    public SummaryImportResultResponse importConfirm(MultipartFile file,
                                                     Long projectId,
                                                     Long sceneId,
                                                     String summaryType,
                                                     String environment,
                                                     String title,
                                                     String tags,
                                                     boolean allowDuplicate,
                                                     String importSource) {
        projectService.requireProject(projectId);
        sceneService.requireSceneInProject(projectId, sceneId);
        ParsedSummaryFile parsed = parseImportFile(file);
        if (FORMAT_SINGLE.equals(parsed.format())) {
            SummaryExportFile single = (SummaryExportFile) parsed.payload();
            SummaryDoc doc = importOne(single.getSummary(), projectId, sceneId, summaryType, environment, title, tags,
                    allowDuplicate, defaultText(importSource, "web_import"), safeFileName(file.getOriginalFilename()));
            SummaryImportResultResponse response = new SummaryImportResultResponse();
            response.setId(doc.getId());
            response.setTitle(doc.getTitle());
            response.setProjectId(doc.getProjectId());
            response.setSceneId(doc.getSceneId());
            response.setSummaryType(doc.getSummaryType());
            response.setEnvironment(doc.getEnvironment());
            response.setSuccessCount(1);
            response.setFailCount(0);
            return response;
        }
        SummaryBatchExportFile batch = (SummaryBatchExportFile) parsed.payload();
        int successCount = 0;
        List<String> failed = new ArrayList<>();
        for (SummaryExportItem item : batch.getItems()) {
            try {
                importOne(item.getSummary(), projectId, sceneId, null, null, null, tags,
                        allowDuplicate, defaultText(importSource, "web_import"), safeFileName(file.getOriginalFilename()));
                successCount++;
            } catch (AppException ex) {
                failed.add(defaultText(item.getSummary() == null ? null : item.getSummary().getTitle(), "未命名文档")
                        + "：" + ex.getMessage());
            }
        }
        SummaryImportResultResponse response = new SummaryImportResultResponse();
        response.setProjectId(projectId);
        response.setSceneId(sceneId);
        response.setSuccessCount(successCount);
        response.setFailCount(failed.size());
        response.setFailedItems(failed);
        return response;
    }

    public void deleteDoc(Long id) {
        if (summaryDocMapper.deleteById(id) == 0) {
            throw new AppException(HttpStatus.NOT_FOUND, "总结文档不存在");
        }
    }

    private String buildCommandSummaryPrompt(DevaiProject project, DevaiScene scene, List<CommandHistory> histories) {
        StringBuilder builder = new StringBuilder();
        builder.append("项目名称：").append(project.getName()).append('\n');
        builder.append("场景：").append(scene == null ? "全部场景" : scene.getName()).append("\n\n");
        builder.append("命令查询历史：\n");
        for (CommandHistory history : histories) {
            builder.append("- ID: ").append(history.getId()).append('\n');
            builder.append("  场景ID: ").append(history.getSceneId()).append('\n');
            builder.append("  问题: ").append(history.getQuestion()).append('\n');
            builder.append("  关键词: ").append(history.getKeyword()).append('\n');
            builder.append("  结果JSON: ").append(truncate(history.getResultJson(), 2500)).append("\n\n");
        }
        return builder.toString();
    }

    private String buildLogSummaryPrompt(DevaiProject project, DevaiScene scene, List<LogAnalysisHistory> histories) {
        StringBuilder builder = new StringBuilder();
        builder.append("项目名称：").append(project.getName()).append('\n');
        builder.append("场景：").append(scene == null ? "全部场景" : scene.getName()).append("\n\n");
        builder.append("日志分析历史：\n");
        for (LogAnalysisHistory history : histories) {
            builder.append("- ID: ").append(history.getId()).append('\n');
            builder.append("  场景ID: ").append(history.getSceneId()).append('\n');
            builder.append("  错误类型: ").append(history.getErrorType()).append('\n');
            builder.append("  摘要: ").append(history.getSummary()).append('\n');
            builder.append("  关键错误行: ").append(truncate(history.getKeyLines(), 1200)).append('\n');
            builder.append("  解决方案: ").append(truncate(history.getSolution(), 1200)).append('\n');
            builder.append("  原始日志片段: ").append(truncate(history.getRawContent(), 1500)).append("\n\n");
        }
        return builder.toString();
    }

    private SummaryDocResponse toResponse(SummaryDoc doc) {
        SummaryDocResponse response = new SummaryDocResponse();
        response.setId(doc.getId());
        response.setProjectId(doc.getProjectId());
        response.setSceneId(doc.getSceneId());
        response.setSummaryType(doc.getSummaryType());
        response.setEnvironment(doc.getEnvironment());
        response.setTitle(doc.getTitle());
        response.setContent(doc.getContent());
        response.setTags(doc.getTags());
        response.setSourceCount(doc.getSourceCount());
        response.setSourceIds(doc.getSourceIds());
        response.setModelName(doc.getModelName());
        response.setImportSource(doc.getImportSource());
        response.setOriginalFileName(doc.getOriginalFileName());
        response.setContentHash(doc.getContentHash());
        response.setCreatedAt(doc.getCreatedAt());
        response.setUpdatedAt(doc.getUpdatedAt());
        return response;
    }

    private SummaryDoc importOne(SummaryExportSummary source,
                                 Long projectId,
                                 Long sceneId,
                                 String requestedType,
                                 String requestedEnvironment,
                                 String requestedTitle,
                                 String requestedTags,
                                 boolean allowDuplicate,
                                 String importSource,
                                 String originalFileName) {
        validateSummary(source);
        String finalType = defaultText(requestedType, source.getSummaryType());
        if (!"command".equals(finalType) && !"log_problem".equals(finalType)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "summaryType 只能是 command 或 log_problem");
        }
        String finalEnvironment = "command".equals(finalType)
                ? defaultText(requestedEnvironment, source.getEnvironment())
                : null;
        String finalTitle = defaultText(requestedTitle, source.getTitle());
        String finalTags = normalizeTags(defaultText(requestedTags, toJson(source.getTags())));
        String hash = contentHash(finalType, finalTitle, source.getContent());
        SummaryDoc duplicate = summaryDocMapper.findDuplicate(projectId, hash);
        if (duplicate != null && !allowDuplicate) {
            throw new AppException(HttpStatus.CONFLICT, "检测到可能重复的总结文档：" + duplicate.getTitle());
        }
        SummaryDoc doc = new SummaryDoc();
        doc.setProjectId(projectId);
        doc.setSceneId(sceneId);
        doc.setSummaryType(finalType);
        doc.setEnvironment(finalEnvironment);
        doc.setTitle(finalTitle);
        doc.setContent(source.getContent());
        doc.setTags(finalTags);
        doc.setSourceCount(source.getSourceCount());
        doc.setSourceIds(toJson(source.getSourceIds()));
        doc.setModelName(source.getModelName());
        doc.setImportSource(importSource);
        doc.setOriginalFileName(originalFileName);
        doc.setContentHash(hash);
        summaryDocMapper.insert(doc);
        return doc;
    }

    private ParsedSummaryFile parseImportFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "导入文件不能为空");
        }
        if (file.getSize() > MAX_IMPORT_SIZE) {
            throw new AppException(HttpStatus.BAD_REQUEST, "导入文件不能超过 5MB");
        }
        try {
            JsonNode root = objectMapper.readTree(file.getInputStream());
            String format = root.path("format").asText("");
            String version = root.path("version").asText("");
            if (!FORMAT_SINGLE.equals(format) && !FORMAT_BATCH.equals(format)) {
                throw invalidImportFile();
            }
            if (!VERSION.equals(version)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "不支持的总结文档格式版本：" + version);
            }
            if (FORMAT_SINGLE.equals(format)) {
                SummaryExportFile single = objectMapper.treeToValue(root, SummaryExportFile.class);
                validateSummary(single.getSummary());
                return new ParsedSummaryFile(format, version, single);
            }
            SummaryBatchExportFile batch = objectMapper.treeToValue(root, SummaryBatchExportFile.class);
            if (batch.getItems().isEmpty()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "批量导入文件没有可导入的文档");
            }
            for (SummaryExportItem item : batch.getItems()) {
                validateSummary(item.getSummary());
            }
            return new ParsedSummaryFile(format, version, batch);
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            throw invalidImportFile();
        }
    }

    private void validateSummary(SummaryExportSummary summary) {
        if (summary == null) {
            throw invalidImportFile();
        }
        String type = summary.getSummaryType();
        if (!"command".equals(type) && !"log_problem".equals(type)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "summaryType 只能是 command 或 log_problem");
        }
        if (summary.getTitle() == null || summary.getTitle().isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "总结文档标题不能为空");
        }
        if (summary.getContent() == null || summary.getContent().isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "总结文档内容不能为空");
        }
    }

    private SummaryExportProject toExportProject(DevaiProject project) {
        SummaryExportProject response = new SummaryExportProject();
        response.setId(project.getId());
        response.setName(project.getName());
        response.setDescription(project.getDescription());
        return response;
    }

    private SummaryExportScene toExportScene(Long sceneId) {
        if (sceneId == null) {
            return null;
        }
        DevaiScene scene = sceneService.requireScene(sceneId);
        SummaryExportScene response = new SummaryExportScene();
        response.setId(scene.getId());
        response.setName(scene.getName());
        response.setDescription(scene.getDescription());
        return response;
    }

    private SummaryExportSummary toExportSummary(SummaryDoc doc) {
        SummaryExportSummary response = new SummaryExportSummary();
        response.setId(doc.getId());
        response.setSummaryType(doc.getSummaryType());
        response.setEnvironment(doc.getEnvironment());
        response.setTitle(doc.getTitle());
        response.setContent(doc.getContent());
        response.setTags(parseStringList(doc.getTags()));
        response.setSourceCount(doc.getSourceCount());
        response.setSourceIds(parseLongList(doc.getSourceIds()));
        response.setModelName(doc.getModelName());
        response.setCreatedAt(formatTime(doc.getCreatedAt()));
        response.setUpdatedAt(formatTime(doc.getUpdatedAt()));
        return response;
    }

    private SummaryDoc requireDoc(Long id) {
        SummaryDoc doc = summaryDocMapper.findById(id);
        if (doc == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "总结文档不存在");
        }
        return doc;
    }

    private String buildCommandTitle(String projectName, DevaiScene scene) {
        return projectName + " " + (scene == null ? "全部场景" : scene.getName()) + " 命令总结";
    }

    private AppException invalidImportFile() {
        return new AppException(HttpStatus.BAD_REQUEST, "该文件不是有效的 DevAI 总结文档导出文件。请确认文件来自 DevAI 的“总结文档导出”功能，且文件格式为 .devai-summary.json。");
    }

    private String contentHash(String summaryType, String title, String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest((defaultText(summaryType, "") + "|" + defaultText(title, "") + "|" + defaultText(content, ""))
                    .getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception ex) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "总结文档指纹生成失败");
        }
    }

    private String normalizeTags(String value) {
        if (value == null || value.isBlank()) {
            return "[]";
        }
        String trimmed = value.trim();
        if (trimmed.startsWith("[")) {
            return trimmed;
        }
        List<String> tags = List.of(trimmed.split(",")).stream()
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .toList();
        return toJson(tags);
    }

    private List<String> parseStringList(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        try {
            if (value.trim().startsWith("[")) {
                return objectMapper.readValue(value, new TypeReference<List<String>>() {
                });
            }
        } catch (Exception ignored) {
            // Fall back to comma split.
        }
        return List.of(value.split(",")).stream()
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .toList();
    }

    private List<Long> parseLongList(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        try {
            if (value.trim().startsWith("[")) {
                return objectMapper.readValue(value, new TypeReference<List<Long>>() {
                });
            }
        } catch (Exception ignored) {
            // Fall back to comma split.
        }
        List<Long> result = new ArrayList<>();
        for (String item : value.split(",")) {
            try {
                result.add(Long.parseLong(item.trim()));
            } catch (NumberFormatException ignored) {
                // Skip invalid legacy source id.
            }
        }
        return result;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? List.of() : value);
        } catch (Exception ex) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "总结文档 JSON 序列化失败");
        }
    }

    private String formatTime(LocalDateTime value) {
        return value == null ? null : value.format(FILE_TIME_FORMAT);
    }

    private String nowText() {
        return LocalDateTime.now().format(FILE_TIME_FORMAT);
    }

    private String safeFileName(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.replace("\\", "/").substring(value.replace("\\", "/").lastIndexOf('/') + 1);
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength) + "...";
    }

    private record ParsedSummaryFile(String format, String version, Object payload) {
    }
}
