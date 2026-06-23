package com.devfix.ai.dto;

import jakarta.validation.constraints.NotBlank;

public class CliAnalyzeRequest {
    private String fileName;
    @NotBlank(message = "content 不能为空")
    private String content;
    private String source;
    private String modelName;

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }
}
