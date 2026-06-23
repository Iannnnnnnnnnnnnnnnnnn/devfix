package com.devfix.ai.dto;

import java.time.LocalDateTime;

public class ApiErrorResponse {
    private String message;
    private int status;
    private LocalDateTime timestamp = LocalDateTime.now();

    public ApiErrorResponse(String message, int status) {
        this.message = message;
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public int getStatus() {
        return status;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}
