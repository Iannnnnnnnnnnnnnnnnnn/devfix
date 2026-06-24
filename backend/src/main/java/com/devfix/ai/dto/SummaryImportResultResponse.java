package com.devfix.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class SummaryImportResultResponse {
    private Long id;
    private String title;
    private Long projectId;
    private Long sceneId;
    private String summaryType;
    private String environment;
    private Integer successCount;
    private Integer failCount;
    private List<String> failedItems = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public String getSummaryType() {
        return summaryType;
    }

    public void setSummaryType(String summaryType) {
        this.summaryType = summaryType;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public Integer getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }

    public Integer getFailCount() {
        return failCount;
    }

    public void setFailCount(Integer failCount) {
        this.failCount = failCount;
    }

    public List<String> getFailedItems() {
        return failedItems;
    }

    public void setFailedItems(List<String> failedItems) {
        this.failedItems = failedItems == null ? new ArrayList<>() : failedItems;
    }
}
