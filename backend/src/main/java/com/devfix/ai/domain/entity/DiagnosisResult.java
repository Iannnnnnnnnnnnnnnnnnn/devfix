package com.devfix.ai.domain.entity;

import java.time.LocalDateTime;

public class DiagnosisResult {
    private Long id;
    private Long diagnosisId;
    private String evidenceJson;
    private String commandsJson;
    private String fixStepsJson;
    private String warningsJson;
    private String needMoreInfoJson;
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDiagnosisId() {
        return diagnosisId;
    }

    public void setDiagnosisId(Long diagnosisId) {
        this.diagnosisId = diagnosisId;
    }

    public String getEvidenceJson() {
        return evidenceJson;
    }

    public void setEvidenceJson(String evidenceJson) {
        this.evidenceJson = evidenceJson;
    }

    public String getCommandsJson() {
        return commandsJson;
    }

    public void setCommandsJson(String commandsJson) {
        this.commandsJson = commandsJson;
    }

    public String getFixStepsJson() {
        return fixStepsJson;
    }

    public void setFixStepsJson(String fixStepsJson) {
        this.fixStepsJson = fixStepsJson;
    }

    public String getWarningsJson() {
        return warningsJson;
    }

    public void setWarningsJson(String warningsJson) {
        this.warningsJson = warningsJson;
    }

    public String getNeedMoreInfoJson() {
        return needMoreInfoJson;
    }

    public void setNeedMoreInfoJson(String needMoreInfoJson) {
        this.needMoreInfoJson = needMoreInfoJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
