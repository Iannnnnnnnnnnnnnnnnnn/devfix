package com.devfix.ai.dto;

import jakarta.validation.constraints.NotBlank;

public class CliCommandRequest {
    @NotBlank(message = "keyword 不能为空")
    private String keyword;

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }
}
