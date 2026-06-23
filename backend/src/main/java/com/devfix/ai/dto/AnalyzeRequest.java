package com.devfix.ai.dto;

import jakarta.validation.constraints.NotBlank;

public class AnalyzeRequest {
    private String projectName;
    @NotBlank(message = "errorType 不能为空")
    private String errorType;
    private String environment;
    @NotBlank(message = "logContent 不能为空")
    private String logContent;

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getErrorType() {
        return errorType;
    }

    public void setErrorType(String errorType) {
        this.errorType = errorType;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public String getLogContent() {
        return logContent;
    }

    public void setLogContent(String logContent) {
        this.logContent = logContent;
    }
}
