package com.devfix.ai.service;

import com.devfix.ai.client.DeepSeekClient;
import com.devfix.ai.config.DeepSeekProperties;
import com.devfix.ai.domain.entity.BugInvestigationRecord;
import com.devfix.ai.domain.entity.BugIssue;
import com.devfix.ai.domain.entity.DevaiProject;
import com.devfix.ai.domain.entity.DevaiScene;
import com.devfix.ai.dto.BugIssueCreateRequest;
import com.devfix.ai.dto.BugIssueListResponse;
import com.devfix.ai.dto.BugIssueResponse;
import com.devfix.ai.dto.BugIssueTypeResponse;
import com.devfix.ai.dto.BugIssueUpdateRequest;
import com.devfix.ai.dto.BugRecordIdResponse;
import com.devfix.ai.dto.BugRecordResponse;
import com.devfix.ai.dto.BugRecordSaveRequest;
import com.devfix.ai.dto.BugRecordSummarizeResponse;
import com.devfix.ai.dto.BugSearchResponse;
import com.devfix.ai.exception.AppException;
import com.devfix.ai.mapper.BugInvestigationRecordMapper;
import com.devfix.ai.mapper.BugIssueMapper;
import com.devfix.ai.support.PromptTemplates;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BugArchiveService {
    private static final List<String> STATUSES = List.of("open", "resolved", "archived");

    private final ProjectService projectService;
    private final SceneService sceneService;
    private final BugIssueMapper issueMapper;
    private final BugInvestigationRecordMapper recordMapper;
    private final DeepSeekClient deepSeekClient;
    private final DeepSeekProperties deepSeekProperties;
    private final ObjectMapper objectMapper;

    public BugArchiveService(ProjectService projectService,
                             SceneService sceneService,
                             BugIssueMapper issueMapper,
                             BugInvestigationRecordMapper recordMapper,
                             DeepSeekClient deepSeekClient,
                             DeepSeekProperties deepSeekProperties,
                             ObjectMapper objectMapper) {
        this.projectService = projectService;
        this.sceneService = sceneService;
        this.issueMapper = issueMapper;
        this.recordMapper = recordMapper;
        this.deepSeekClient = deepSeekClient;
        this.deepSeekProperties = deepSeekProperties;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public BugRecordIdResponse createIssue(BugIssueCreateRequest request) {
        projectService.requireProject(request.getProjectId());
        sceneService.requireSceneInProject(request.getProjectId(), request.getSceneId());
        BugIssue issue = new BugIssue();
        issue.setProjectId(request.getProjectId());
        issue.setSceneId(request.getSceneId());
        issue.setIssueName(request.getIssueName().trim());
        issue.setStatus(normalizeStatus(defaultText(request.getStatus(), "open")));
        issue.setErrorType(normalize(request.getErrorType()));
        issue.setTags(toJson(defaultTags(request.getTags())));
        issue.setSummary("");
        issueMapper.insert(issue);
        return new BugRecordIdResponse(issue.getId());
    }

    public BugIssueListResponse listIssues(Long projectId,
                                           Long sceneId,
                                           String issueName,
                                           String keyword,
                                           String status,
                                           String errorType,
                                           String tag,
                                           int page,
                                           int pageSize) {
        if (projectId != null) {
            projectService.requireProject(projectId);
        }
        if (projectId != null && sceneId != null) {
            sceneService.requireSceneInProject(projectId, sceneId);
        }
        int limit = Math.max(1, Math.min(pageSize, 100));
        int offset = Math.max(0, page - 1) * limit;
        List<BugIssueResponse> issues = issueMapper.findPage(projectId, sceneId, normalize(issueName), normalize(keyword), normalize(status),
                        normalize(errorType), normalize(tag), limit, offset)
                .stream()
                .map(this::toIssueResponse)
                .toList();
        BugIssueListResponse response = new BugIssueListResponse();
        response.setList(issues);
        response.setTotal(issueMapper.countPage(projectId, sceneId, normalize(issueName), normalize(keyword), normalize(status), normalize(errorType), normalize(tag)));
        return response;
    }

    public BugIssueResponse detail(Long id) {
        BugIssue issue = requireIssue(id);
        BugIssueResponse response = toIssueResponse(issue);
        response.setRecords(recordMapper.findByIssueId(id).stream().map(this::toRecordResponse).toList());
        return response;
    }

    public List<BugIssueTypeResponse> issueTypes(Long projectId, Long sceneId) {
        if (projectId != null) {
            projectService.requireProject(projectId);
        }
        if (projectId != null && sceneId != null) {
            sceneService.requireSceneInProject(projectId, sceneId);
        }
        return issueMapper.findIssueTypes(projectId, sceneId);
    }

    @Transactional
    public BugIssueResponse updateIssue(Long id, BugIssueUpdateRequest request) {
        BugIssue issue = requireIssue(id);
        issue.setIssueName(defaultText(request.getIssueName(), issue.getIssueName()));
        issue.setStatus(normalizeStatus(defaultText(request.getStatus(), issue.getStatus())));
        issue.setErrorType(defaultText(request.getErrorType(), issue.getErrorType()));
        issue.setSummary(defaultText(request.getSummary(), issue.getSummary()));
        if (request.getTags() != null) {
            issue.setTags(toJson(defaultTags(request.getTags())));
        }
        issueMapper.update(issue);
        return detail(id);
    }

    @Transactional
    public void deleteIssue(Long id) {
        requireIssue(id);
        recordMapper.deleteByIssueId(id);
        issueMapper.deleteById(id);
    }

    public BugRecordSummarizeResponse summarize(Long projectId, Long issueId, String rawContent) {
        DevaiProject project = projectService.requireProject(projectId);
        BugIssue issue = requireIssueInProject(issueId, projectId);
        String aiSummary = deepSeekClient.chatText(PromptTemplates.BUG_INVESTIGATION_SYSTEM,
                buildBugPrompt(project, issue, rawContent));
        BugRecordSummarizeResponse response = new BugRecordSummarizeResponse();
        response.setAiSummary(aiSummary);
        response.setSuggestedTitle(issue.getIssueName());
        response.setSuggestedErrorType(issue.getErrorType());
        response.setSuggestedTags(parseTags(issue.getTags()));
        return response;
    }

    @Transactional
    public BugRecordIdResponse saveRecord(BugRecordSaveRequest request) {
        projectService.requireProject(request.getProjectId());
        BugIssue issue = requireIssueInProject(request.getIssueId(), request.getProjectId());
        BugInvestigationRecord record = new BugInvestigationRecord();
        record.setIssueId(request.getIssueId());
        record.setProjectId(request.getProjectId());
        record.setSource(defaultText(request.getSource(), "web"));
        record.setRawContent(defaultText(request.getRawContent(), ""));
        record.setAiSummary(defaultText(request.getAiSummary(), ""));
        record.setFinalContent(request.getFinalContent().trim());
        record.setContentText(buildContentText(record));
        record.setModelName(defaultText(request.getModelName(), deepSeekProperties.getModel()));
        recordMapper.insert(record);

        issue.setStatus(normalizeStatus(defaultText(request.getStatus(), issue.getStatus())));
        issue.setErrorType(defaultText(request.getErrorType(), issue.getErrorType()));
        if (request.getTags() != null) {
            issue.setTags(toJson(defaultTags(request.getTags())));
        }
        issue.setSummary(defaultText(request.getSummary(), summarizeFinalContent(record.getFinalContent())));
        issueMapper.update(issue);
        return new BugRecordIdResponse(record.getId());
    }

    @Transactional
    public void deleteRecord(Long id) {
        BugInvestigationRecord record = recordMapper.findById(id);
        if (record == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "排查记录不存在");
        }
        recordMapper.deleteById(id);
    }

    public BugSearchResponse search(Long projectId,
                                    Long sceneId,
                                    String issueName,
                                    String keyword,
                                    String status,
                                    String errorType,
                                    String tag,
                                    int page,
                                    int pageSize) {
        if (projectId != null) {
            projectService.requireProject(projectId);
        }
        if (projectId != null && sceneId != null) {
            sceneService.requireSceneInProject(projectId, sceneId);
        }
        int limit = Math.max(1, Math.min(pageSize, 100));
        int offset = Math.max(0, page - 1) * limit;
        BugSearchResponse response = new BugSearchResponse();
        response.setList(recordMapper.search(projectId, sceneId, normalize(issueName), normalize(keyword), normalize(status), normalize(errorType), normalize(tag), limit, offset)
                .stream()
                .peek(item -> item.setHitContent(truncate(item.getHitContent(), 240)))
                .toList());
        response.setTotal(recordMapper.countSearch(projectId, sceneId, normalize(issueName), normalize(keyword), normalize(status), normalize(errorType), normalize(tag)));
        return response;
    }

    private String buildBugPrompt(DevaiProject project, BugIssue issue, String rawContent) {
        return """
                项目名称：%s
                问题名称：%s
                当前错误类型：%s
                当前标签：%s

                用户白话排查过程：
                %s
                """.formatted(project.getName(), issue.getIssueName(), defaultText(issue.getErrorType(), "未填写"),
                String.join(", ", parseTags(issue.getTags())), rawContent);
    }

    private BugIssue requireIssue(Long id) {
        BugIssue issue = issueMapper.findById(id);
        if (issue == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "Bug 问题不存在");
        }
        return issue;
    }

    private BugIssue requireIssueInProject(Long issueId, Long projectId) {
        BugIssue issue = requireIssue(issueId);
        if (!projectId.equals(issue.getProjectId())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Bug 问题不属于当前项目");
        }
        return issue;
    }

    private BugIssueResponse toIssueResponse(BugIssue issue) {
        DevaiProject project = projectService.requireProject(issue.getProjectId());
        DevaiScene scene = sceneService.requireScene(issue.getSceneId());
        BugIssueResponse response = new BugIssueResponse();
        response.setId(issue.getId());
        response.setProjectId(issue.getProjectId());
        response.setProjectName(project.getName());
        response.setSceneId(scene.getId());
        response.setSceneName(scene.getName());
        response.setIssueName(issue.getIssueName());
        response.setStatus(issue.getStatus());
        response.setErrorType(issue.getErrorType());
        response.setTags(parseTags(issue.getTags()));
        response.setSummary(issue.getSummary());
        response.setCreatedAt(issue.getCreatedAt());
        response.setUpdatedAt(issue.getUpdatedAt());
        return response;
    }

    private BugRecordResponse toRecordResponse(BugInvestigationRecord record) {
        BugRecordResponse response = new BugRecordResponse();
        response.setId(record.getId());
        response.setIssueId(record.getIssueId());
        response.setProjectId(record.getProjectId());
        response.setSource(record.getSource());
        response.setRawContent(record.getRawContent());
        response.setAiSummary(record.getAiSummary());
        response.setFinalContent(record.getFinalContent());
        response.setModelName(record.getModelName());
        response.setCreatedAt(record.getCreatedAt());
        response.setUpdatedAt(record.getUpdatedAt());
        return response;
    }

    private List<String> defaultTags(List<String> tags) {
        return tags == null ? List.of() : tags.stream().map(String::trim).filter(item -> !item.isBlank()).distinct().toList();
    }

    private String normalizeStatus(String status) {
        String normalized = defaultText(status, "open");
        if (!STATUSES.contains(normalized)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "status 只能是 open、resolved 或 archived");
        }
        return normalized;
    }

    private String buildContentText(BugInvestigationRecord record) {
        return String.join("\n\n", List.of(record.getRawContent(), record.getAiSummary(), record.getFinalContent()))
                .replaceAll("(?m)^#{1,6}\\s*", "")
                .trim();
    }

    private String summarizeFinalContent(String content) {
        String normalized = defaultText(content, "");
        for (String line : normalized.split("\\R")) {
            String text = line.replaceFirst("^#{1,6}\\s*", "").trim();
            if (!text.isBlank() && !text.startsWith("Bug 排查记录")) {
                return truncate(text, 500);
            }
        }
        return truncate(normalized, 500);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? List.of() : value);
        } catch (Exception ex) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Bug 标签 JSON 序列化失败");
        }
    }

    private List<String> parseTags(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(value, new TypeReference<List<String>>() {
            });
        } catch (Exception ignored) {
            return List.of(value.split(",")).stream().map(String::trim).filter(item -> !item.isBlank()).toList();
        }
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
