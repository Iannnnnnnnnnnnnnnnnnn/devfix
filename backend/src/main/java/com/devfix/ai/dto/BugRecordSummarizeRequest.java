package com.devfix.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BugRecordSummarizeRequest {
    @NotNull(message = "projectId 不能为空")
    private Long projectId;
    @NotNull(message = "issueId 不能为空")
    private Long issueId;
    @NotBlank(message = "rawContent 不能为空")
    private String rawContent;
    private String source;

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getIssueId() {
        return issueId;
    }

    public void setIssueId(Long issueId) {
        this.issueId = issueId;
    }

    public String getRawContent() {
        return rawContent;
    }

    public void setRawContent(String rawContent) {
        this.rawContent = rawContent;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
