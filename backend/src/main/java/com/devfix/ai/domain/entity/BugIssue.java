package com.devfix.ai.domain.entity;

import java.time.LocalDateTime;

public class BugIssue {
    private Long id;
    private Long projectId;
    private Long sceneId;
    private String issueName;
    private String status;
    private String errorType;
    private String tags;
    private String summary;
    private String relatedLogHistoryIds;
    private String relatedCommandHistoryIds;
    private String relatedSummaryDocIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getIssueName() {
        return issueName;
    }

    public void setIssueName(String issueName) {
        this.issueName = issueName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getErrorType() {
        return errorType;
    }

    public void setErrorType(String errorType) {
        this.errorType = errorType;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getRelatedLogHistoryIds() {
        return relatedLogHistoryIds;
    }

    public void setRelatedLogHistoryIds(String relatedLogHistoryIds) {
        this.relatedLogHistoryIds = relatedLogHistoryIds;
    }

    public String getRelatedCommandHistoryIds() {
        return relatedCommandHistoryIds;
    }

    public void setRelatedCommandHistoryIds(String relatedCommandHistoryIds) {
        this.relatedCommandHistoryIds = relatedCommandHistoryIds;
    }

    public String getRelatedSummaryDocIds() {
        return relatedSummaryDocIds;
    }

    public void setRelatedSummaryDocIds(String relatedSummaryDocIds) {
        this.relatedSummaryDocIds = relatedSummaryDocIds;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
