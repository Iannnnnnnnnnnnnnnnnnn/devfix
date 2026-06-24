package com.devfix.ai.service;

import com.devfix.ai.domain.entity.CommandHistory;
import com.devfix.ai.domain.entity.LogAnalysisHistory;
import com.devfix.ai.dto.CommandHistoryResponse;
import com.devfix.ai.dto.LogHistoryResponse;
import com.devfix.ai.mapper.CommandHistoryMapper;
import com.devfix.ai.mapper.LogAnalysisHistoryMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DevaiHistoryService {
    private final LogAnalysisHistoryMapper logHistoryMapper;
    private final CommandHistoryMapper commandHistoryMapper;

    public DevaiHistoryService(LogAnalysisHistoryMapper logHistoryMapper,
                               CommandHistoryMapper commandHistoryMapper) {
        this.logHistoryMapper = logHistoryMapper;
        this.commandHistoryMapper = commandHistoryMapper;
    }

    public List<LogHistoryResponse> queryLogs(Long projectId, Long sceneId, String errorType, String keyword,
                                              LocalDateTime startTime, LocalDateTime endTime,
                                              int page, int pageSize) {
        int limit = normalizePageSize(pageSize);
        int offset = normalizeOffset(page, limit);
        return logHistoryMapper.findPage(projectId, sceneId, errorType, keyword, startTime, endTime, limit, offset)
                .stream()
                .map(this::toLogResponse)
                .toList();
    }

    public List<CommandHistoryResponse> queryCommands(Long projectId, Long sceneId, String keyword,
                                                      LocalDateTime startTime, LocalDateTime endTime,
                                                      int page, int pageSize) {
        int limit = normalizePageSize(pageSize);
        int offset = normalizeOffset(page, limit);
        return commandHistoryMapper.findPage(projectId, sceneId, null, keyword, startTime, endTime, limit, offset)
                .stream()
                .map(this::toCommandResponse)
                .toList();
    }

    private LogHistoryResponse toLogResponse(LogAnalysisHistory history) {
        LogHistoryResponse response = new LogHistoryResponse();
        response.setId(history.getId());
        response.setProjectId(history.getProjectId());
        response.setSceneId(history.getSceneId());
        response.setSource(history.getSource());
        response.setQuestion(history.getQuestion());
        response.setSummary(history.getSummary());
        response.setErrorType(history.getErrorType());
        response.setKeyLines(history.getKeyLines());
        response.setSolution(history.getSolution());
        response.setResultJson(history.getResultJson());
        response.setModelName(history.getModelName());
        response.setCreatedAt(history.getCreatedAt());
        return response;
    }

    private CommandHistoryResponse toCommandResponse(CommandHistory history) {
        CommandHistoryResponse response = new CommandHistoryResponse();
        response.setId(history.getId());
        response.setProjectId(history.getProjectId());
        response.setSceneId(history.getSceneId());
        response.setEnvironment(history.getEnvironment());
        response.setSource(history.getSource());
        response.setKeyword(history.getKeyword());
        response.setQuestion(history.getQuestion());
        response.setSummary(history.getSummary());
        response.setResultJson(history.getResultJson());
        response.setModelName(history.getModelName());
        response.setCreatedAt(history.getCreatedAt());
        return response;
    }

    private int normalizePageSize(int pageSize) {
        return Math.max(1, Math.min(pageSize, 100));
    }

    private int normalizeOffset(int page, int pageSize) {
        return Math.max(0, page - 1) * pageSize;
    }
}
