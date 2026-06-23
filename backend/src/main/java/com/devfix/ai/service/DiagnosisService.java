package com.devfix.ai.service;

import com.devfix.ai.client.DeepSeekClient;
import com.devfix.ai.domain.entity.DiagnosisRecord;
import com.devfix.ai.domain.entity.DiagnosisResult;
import com.devfix.ai.dto.AnalyzeRequest;
import com.devfix.ai.dto.CommandItem;
import com.devfix.ai.dto.DiagnosisDetailResponse;
import com.devfix.ai.dto.DiagnosisResponse;
import com.devfix.ai.dto.DiagnosisStatsResponse;
import com.devfix.ai.dto.HistoryRecordResponse;
import com.devfix.ai.exception.AiResponseParseException;
import com.devfix.ai.exception.AppException;
import com.devfix.ai.mapper.DiagnosisRecordMapper;
import com.devfix.ai.mapper.DiagnosisResultMapper;
import com.devfix.ai.support.LogContentHelper;
import com.devfix.ai.support.PromptTemplates;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class DiagnosisService {
    private static final int HISTORY_LIMIT = 50;

    private final DiagnosisRecordMapper recordMapper;
    private final DiagnosisResultMapper resultMapper;
    private final DeepSeekClient deepSeekClient;
    private final ObjectMapper objectMapper;
    private final LogContentHelper logContentHelper;

    public DiagnosisService(DiagnosisRecordMapper recordMapper,
                            DiagnosisResultMapper resultMapper,
                            DeepSeekClient deepSeekClient,
                            ObjectMapper objectMapper,
                            LogContentHelper logContentHelper) {
        this.recordMapper = recordMapper;
        this.resultMapper = resultMapper;
        this.deepSeekClient = deepSeekClient;
        this.objectMapper = objectMapper;
        this.logContentHelper = logContentHelper;
    }

    @Transactional
    public DiagnosisResponse analyze(AnalyzeRequest request) {
        String maskedLog = logContentHelper.maskSensitiveData(request.getLogContent());
        DiagnosisResponse aiResult = requestAiDiagnosis(request, maskedLog);

        DiagnosisRecord record = new DiagnosisRecord();
        record.setProjectName(defaultText(request.getProjectName(), "未命名项目"));
        record.setErrorType(request.getErrorType());
        record.setEnvironment(defaultText(request.getEnvironment(), "local"));
        record.setRawLog(maskedLog);
        record.setSummary(aiResult.getSummary());
        record.setRootCause(aiResult.getRootCause());
        record.setStatus("UNRESOLVED");
        recordMapper.insert(record);

        DiagnosisResult result = new DiagnosisResult();
        result.setDiagnosisId(record.getId());
        result.setEvidenceJson(toJson(aiResult.getEvidence()));
        result.setCommandsJson(toJson(aiResult.getCommands()));
        result.setFixStepsJson(toJson(aiResult.getFixSteps()));
        result.setWarningsJson(toJson(aiResult.getWarnings()));
        result.setNeedMoreInfoJson(toJson(aiResult.getNeedMoreInfo()));
        resultMapper.insert(result);

        aiResult.setId(record.getId());
        return aiResult;
    }

    public List<HistoryRecordResponse> history() {
        return recordMapper.findRecent(HISTORY_LIMIT).stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    public DiagnosisDetailResponse detail(Long id) {
        DiagnosisRecord record = recordMapper.findById(id);
        if (record == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "分析记录不存在");
        }
        DiagnosisResult result = resultMapper.findByDiagnosisId(id);
        DiagnosisDetailResponse response = new DiagnosisDetailResponse();
        response.setId(record.getId());
        response.setProjectName(record.getProjectName());
        response.setErrorType(record.getErrorType());
        response.setEnvironment(record.getEnvironment());
        response.setRawLog(record.getRawLog());
        response.setSummary(record.getSummary());
        response.setRootCause(record.getRootCause());
        response.setStatus(record.getStatus());
        response.setCreatedAt(record.getCreatedAt());
        response.setUpdatedAt(record.getUpdatedAt());
        if (result != null) {
            response.setEvidence(fromJson(result.getEvidenceJson(), new TypeReference<List<String>>() {
            }));
            response.setCommands(fromJson(result.getCommandsJson(), new TypeReference<List<CommandItem>>() {
            }));
            response.setFixSteps(fromJson(result.getFixStepsJson(), new TypeReference<List<String>>() {
            }));
            response.setWarnings(fromJson(result.getWarningsJson(), new TypeReference<List<String>>() {
            }));
            response.setNeedMoreInfo(fromJson(result.getNeedMoreInfoJson(), new TypeReference<List<String>>() {
            }));
        }
        return response;
    }

    public DiagnosisStatsResponse stats() {
        return new DiagnosisStatsResponse(recordMapper.countToday(), recordMapper.countAll());
    }

    private DiagnosisResponse requestAiDiagnosis(AnalyzeRequest request, String maskedLog) {
        String userPrompt = """
                项目名称：%s
                报错类型：%s
                环境：%s

                报错日志：
                %s
                """.formatted(
                defaultText(request.getProjectName(), "未命名项目"),
                request.getErrorType(),
                defaultText(request.getEnvironment(), "local"),
                logContentHelper.buildPromptLog(maskedLog)
        );
        try {
            return deepSeekClient.chatJson(PromptTemplates.DIAGNOSIS_SYSTEM, userPrompt, DiagnosisResponse.class);
        } catch (AiResponseParseException ex) {
            return fallbackDiagnosis("AI 返回内容不是合法 JSON，请缩短日志或重试。");
        }
    }

    private DiagnosisResponse fallbackDiagnosis(String message) {
        DiagnosisResponse response = new DiagnosisResponse();
        response.setSummary(message);
        response.setRootCause("DeepSeek 响应解析失败，后端已兜底处理，接口不会崩溃。");
        response.setEvidence(List.of("AI 响应未能解析为约定 JSON 结构。"));
        response.setCommands(new ArrayList<>());
        response.setFixSteps(List.of("检查日志长度和内容是否过大。", "稍后重试，或调整提示词让模型只返回 JSON。"));
        response.setWarnings(List.of("当前结论不是模型正常分析结果。"));
        response.setNeedMoreInfo(List.of("需要 DeepSeek 原始响应内容时，可临时开启后端调试日志。"));
        return response;
    }

    private HistoryRecordResponse toHistoryResponse(DiagnosisRecord record) {
        HistoryRecordResponse response = new HistoryRecordResponse();
        response.setId(record.getId());
        response.setProjectName(record.getProjectName());
        response.setErrorType(record.getErrorType());
        response.setEnvironment(record.getEnvironment());
        response.setSummary(record.getSummary());
        response.setRootCause(record.getRootCause());
        response.setStatus(record.getStatus());
        response.setCreatedAt(record.getCreatedAt());
        return response;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? List.of() : value);
        } catch (Exception ex) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "JSON 序列化失败");
        }
    }

    private <T> T fromJson(String json, TypeReference<T> typeReference) {
        try {
            if (json == null || json.isBlank()) {
                return objectMapper.readValue("[]", typeReference);
            }
            return objectMapper.readValue(json, typeReference);
        } catch (Exception ex) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "历史分析结果 JSON 解析失败");
        }
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
