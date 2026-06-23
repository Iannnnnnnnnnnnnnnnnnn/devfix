package com.devfix.ai.dto;

import jakarta.validation.constraints.NotBlank;

public class CommandRecommendRequest {
    @NotBlank(message = "question 不能为空")
    private String question;
    private String environment;

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }
}
