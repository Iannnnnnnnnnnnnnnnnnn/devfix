package com.devfix.ai.dto;

public class KnowledgeGenerateResponse {
    private String message;

    public KnowledgeGenerateResponse() {
    }

    public KnowledgeGenerateResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
