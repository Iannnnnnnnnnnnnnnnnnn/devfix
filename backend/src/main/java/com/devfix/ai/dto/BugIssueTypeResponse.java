package com.devfix.ai.dto;

public class BugIssueTypeResponse {
    private String errorType;
    private Long count;

    public String getErrorType() {
        return errorType;
    }

    public void setErrorType(String errorType) {
        this.errorType = errorType;
    }

    public Long getCount() {
        return count;
    }

    public void setCount(Long count) {
        this.count = count;
    }
}
