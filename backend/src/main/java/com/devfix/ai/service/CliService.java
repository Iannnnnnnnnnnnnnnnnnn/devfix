package com.devfix.ai.service;

import com.devfix.ai.config.DeepSeekProperties;
import com.devfix.ai.domain.entity.AnalysisHistory;
import com.devfix.ai.domain.entity.CommandHistory;
import com.devfix.ai.domain.entity.DevaiScene;
import com.devfix.ai.domain.entity.DevaiProject;
import com.devfix.ai.domain.entity.LogAnalysisHistory;
import com.devfix.ai.dto.AnalyzeRequest;
import com.devfix.ai.dto.CliAnalyzeRequest;
import com.devfix.ai.dto.CliAnalyzeResponse;
import com.devfix.ai.dto.CliCommandItem;
import com.devfix.ai.dto.CliCommandRequest;
import com.devfix.ai.dto.CliCommandResponse;
import com.devfix.ai.dto.CommandItem;
import com.devfix.ai.dto.CommandRecommendRequest;
import com.devfix.ai.dto.CommandRecommendResponse;
import com.devfix.ai.dto.DiagnosisResponse;
import com.devfix.ai.dto.HistoryDetailResponse;
import com.devfix.ai.dto.HistoryListResponse;
import com.devfix.ai.dto.HistorySummaryResponse;
import com.devfix.ai.exception.AppException;
import com.devfix.ai.mapper.AnalysisHistoryMapper;
import com.devfix.ai.mapper.CommandHistoryMapper;
import com.devfix.ai.mapper.LogAnalysisHistoryMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CliService {
    private final DiagnosisService diagnosisService;
    private final CommandService commandService;
    private final ProjectService projectService;
    private final SceneService sceneService;
    private final AnalysisHistoryMapper historyMapper;
    private final LogAnalysisHistoryMapper logHistoryMapper;
    private final CommandHistoryMapper commandHistoryMapper;
    private final DeepSeekProperties deepSeekProperties;
    private final ObjectMapper objectMapper;

    public CliService(DiagnosisService diagnosisService,
                      CommandService commandService,
                      ProjectService projectService,
                      SceneService sceneService,
                      AnalysisHistoryMapper historyMapper,
                      LogAnalysisHistoryMapper logHistoryMapper,
                      CommandHistoryMapper commandHistoryMapper,
                      DeepSeekProperties deepSeekProperties,
                      ObjectMapper objectMapper) {
        this.diagnosisService = diagnosisService;
        this.commandService = commandService;
        this.projectService = projectService;
        this.sceneService = sceneService;
        this.historyMapper = historyMapper;
        this.logHistoryMapper = logHistoryMapper;
        this.commandHistoryMapper = commandHistoryMapper;
        this.deepSeekProperties = deepSeekProperties;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public CliAnalyzeResponse analyzeLog(CliAnalyzeRequest request) {
        return analyze(request, defaultText(request.getSource(), "cli-paste"), "CLI 粘贴日志");
    }

    @Transactional
    public CliAnalyzeResponse analyzeFile(CliAnalyzeRequest request) {
        return analyze(request, defaultText(request.getSource(), "cli-file"), defaultText(request.getFileName(), "CLI 日志文件"));
    }

    @Transactional
    public CliCommandResponse searchCommand(CliCommandRequest request) {
        DevaiProject project = projectService.requireProject(request.getProjectId());
        DevaiScene scene = sceneService.requireSceneInProject(project.getId(), request.getSceneId());
        String environment = defaultText(request.getEnvironment(), "Other");
        String question = defaultText(request.getQuestion(), request.getKeyword());
        CommandRecommendRequest recommendRequest = new CommandRecommendRequest();
        recommendRequest.setQuestion(question);
        recommendRequest.setEnvironment(environment);
        CommandRecommendResponse recommendResponse = commandService.recommend(recommendRequest);

        CliCommandResponse response = toCliCommandResponse(question, environment, recommendResponse);
        Long historyId = saveCommandHistory(project.getId(), scene.getId(), environment, defaultText(request.getSource(), "cli-cmd"),
                request.getKeyword(), question, response, response.getScenario(), request.getModelName());
        response.setHistoryId(historyId);
        saveHistory(defaultText(request.getSource(), "cli-cmd"), request.getKeyword(), request.getKeyword(),
                response, response.getScenario(), response.getCategory(), request.getModelName());
        return response;
    }

    public HistoryListResponse recentHistory(int limit) {
        int normalizedLimit = Math.max(1, Math.min(limit, 100));
        HistoryListResponse response = new HistoryListResponse();
        response.setList(historyMapper.findRecent(normalizedLimit).stream()
                .map(this::toHistorySummary)
                .toList());
        return response;
    }

    public HistoryDetailResponse historyDetail(Long id) {
        AnalysisHistory history = historyMapper.findById(id);
        if (history == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "历史记录不存在");
        }
        return toHistoryDetail(history);
    }

    public void deleteHistory(Long id) {
        if (historyMapper.deleteById(id) == 0) {
            throw new AppException(HttpStatus.NOT_FOUND, "历史记录不存在");
        }
    }

    private CliAnalyzeResponse analyze(CliAnalyzeRequest request, String source, String question) {
        DevaiProject project = projectService.requireProject(request.getProjectId());
        DevaiScene scene = sceneService.requireSceneInProject(project.getId(), request.getSceneId());
        AnalyzeRequest analyzeRequest = new AnalyzeRequest();
        analyzeRequest.setProjectName(project.getName());
        analyzeRequest.setErrorType("cli-log");
        analyzeRequest.setEnvironment("local-cli");
        analyzeRequest.setLogContent(request.getContent());

        DiagnosisResponse diagnosis = diagnosisService.analyze(analyzeRequest);
        CliAnalyzeResponse response = toCliAnalyzeResponse(diagnosis);
        Long historyId = saveLogHistory(project.getId(), scene.getId(), source, question, request.getContent(), response,
                response.getErrorType(), response.getErrorType(), request.getModelName());
        response.setHistoryId(historyId);
        saveHistory(source, question, request.getContent(), response,
                response.getErrorType(), response.getErrorType(), request.getModelName());
        return response;
    }

    private CliAnalyzeResponse toCliAnalyzeResponse(DiagnosisResponse diagnosis) {
        CliAnalyzeResponse response = new CliAnalyzeResponse();
        response.setId(diagnosis.getId());
        response.setErrorType(defaultText(diagnosis.getSummary(), "日志分析结果"));
        response.setCause(defaultText(diagnosis.getRootCause(), "AI 未返回明确原因"));
        response.setKeyLines(diagnosis.getEvidence());
        response.setImpact(firstNonBlank(diagnosis.getWarnings(), "请结合关键错误行评估影响范围"));
        response.setSolution(diagnosis.getFixSteps());
        response.setCommands(diagnosis.getCommands().stream()
                .map(CommandItem::getCommand)
                .filter(command -> command != null && !command.isBlank())
                .toList());
        response.setKnowledge(diagnosis.getNeedMoreInfo());
        return response;
    }

    private CliCommandResponse toCliCommandResponse(String keyword, String environment, CommandRecommendResponse recommendResponse) {
        CliCommandResponse response = new CliCommandResponse();
        response.setCategory(defaultText(environment, inferCategory(keyword)));
        response.setScenario(keyword);
        response.setCommands(recommendResponse.getCommands().stream().map(item -> {
            CliCommandItem cliItem = new CliCommandItem();
            cliItem.setCommand(item.getCommand());
            cliItem.setDescription(item.getDescription());
            cliItem.setExample(item.getCommand());
            return cliItem;
        }).toList());
        response.setTips(recommendResponse.getCommands().stream()
                .filter(item -> item.getRiskLevel() != null && !"safe".equalsIgnoreCase(item.getRiskLevel()))
                .map(item -> "风险等级：" + item.getRiskLevel() + "，执行前请确认影响范围。")
                .distinct()
                .toList());
        return response;
    }

    private Long saveLogHistory(Long projectId, Long sceneId, String source, String question, String rawContent, CliAnalyzeResponse result,
                                String summary, String errorType, String requestedModelName) {
        LogAnalysisHistory history = new LogAnalysisHistory();
        history.setProjectId(projectId);
        history.setSceneId(sceneId);
        history.setSource(source);
        history.setQuestion(question);
        history.setRawContent(rawContent);
        history.setResultJson(toJson(result));
        history.setModelName(defaultText(requestedModelName, deepSeekProperties.getModel()));
        history.setSummary(summary);
        history.setErrorType(errorType);
        history.setKeyLines(toJson(result.getKeyLines()));
        history.setSolution(toJson(result.getSolution()));
        logHistoryMapper.insert(history);
        return history.getId();
    }

    private Long saveCommandHistory(Long projectId, Long sceneId, String environment, String source, String keyword, String question,
                                    CliCommandResponse result, String summary, String requestedModelName) {
        CommandHistory history = new CommandHistory();
        history.setProjectId(projectId);
        history.setSceneId(sceneId);
        history.setEnvironment(environment);
        history.setSource(source);
        history.setKeyword(keyword);
        history.setQuestion(question);
        history.setResultJson(toJson(result));
        history.setModelName(defaultText(requestedModelName, deepSeekProperties.getModel()));
        history.setSummary(summary);
        commandHistoryMapper.insert(history);
        return history.getId();
    }

    private HistorySummaryResponse toHistorySummary(AnalysisHistory history) {
        HistorySummaryResponse response = new HistorySummaryResponse();
        response.setId(history.getId());
        response.setSource(history.getSource());
        response.setSummary(history.getSummary());
        response.setErrorType(history.getErrorType());
        response.setCreatedAt(history.getCreatedAt());
        return response;
    }

    private HistoryDetailResponse toHistoryDetail(AnalysisHistory history) {
        HistoryDetailResponse response = new HistoryDetailResponse();
        response.setId(history.getId());
        response.setSource(history.getSource());
        response.setQuestion(history.getQuestion());
        response.setRawContent(history.getRawContent());
        response.setResultJson(history.getResultJson());
        response.setModelName(history.getModelName());
        response.setSummary(history.getSummary());
        response.setErrorType(history.getErrorType());
        response.setCreatedAt(history.getCreatedAt());
        response.setUpdatedAt(history.getUpdatedAt());
        return response;
    }

    private void saveHistory(String source, String question, String rawContent, Object result,
                             String summary, String errorType, String requestedModelName) {
        AnalysisHistory history = new AnalysisHistory();
        history.setSource(source);
        history.setQuestion(question);
        history.setRawContent(rawContent);
        history.setResultJson(toJson(result));
        history.setModelName(defaultText(requestedModelName, deepSeekProperties.getModel()));
        history.setSummary(summary);
        history.setErrorType(errorType);
        historyMapper.insert(history);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "CLI 历史记录 JSON 序列化失败");
        }
    }

    private String inferCategory(String keyword) {
        String lower = keyword == null ? "" : keyword.toLowerCase();
        if (lower.contains("docker")) {
            return "Docker";
        }
        if (lower.contains("mysql")) {
            return "MySQL";
        }
        if (lower.contains("git")) {
            return "Git";
        }
        if (lower.contains("java") || lower.contains("maven")) {
            return "Java";
        }
        if (lower.contains("nginx")) {
            return "Nginx";
        }
        if (lower.contains("linux") || lower.contains("log")) {
            return "Linux";
        }
        return "开发命令";
    }

    private String firstNonBlank(List<String> values, String fallback) {
        if (values == null) {
            return fallback;
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .findFirst()
                .orElse(fallback);
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
