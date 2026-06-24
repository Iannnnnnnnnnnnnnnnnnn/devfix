package com.devfix.ai.dto;

import jakarta.validation.constraints.NotNull;

public class SummaryGenerateRequest {
    @NotNull(message = "projectId 不能为空")
    private Long projectId;
    private Long sceneId;
    private String environment;

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getSceneId() {
        return sceneId;
    }

    public void setSceneId(Long sceneId) {
        this.sceneId = sceneId;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }
}
