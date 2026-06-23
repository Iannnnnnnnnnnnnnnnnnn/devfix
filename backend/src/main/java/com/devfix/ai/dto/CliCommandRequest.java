package com.devfix.ai.dto;

import jakarta.validation.constraints.NotBlank;

public class CliCommandRequest {
    @NotBlank(message = "keyword 不能为空")
    private String keyword;
    private String source;
    private String modelName;

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
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
