package com.devfix.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class SummaryImportPreviewResponse {
    private String format;
    private String version;
    private SummaryExportProject projectInFile;
    private SummaryExportScene sceneInFile;
    private SummaryExportSummary summaryInFile;
    private List<SummaryExportSummary> items = new ArrayList<>();
    private List<ProjectResponse> availableProjects = new ArrayList<>();
    private List<String> availableEnvironments = new ArrayList<>();

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public SummaryExportProject getProjectInFile() {
        return projectInFile;
    }

    public void setProjectInFile(SummaryExportProject projectInFile) {
        this.projectInFile = projectInFile;
    }

    public SummaryExportScene getSceneInFile() {
        return sceneInFile;
    }

    public void setSceneInFile(SummaryExportScene sceneInFile) {
        this.sceneInFile = sceneInFile;
    }

    public SummaryExportSummary getSummaryInFile() {
        return summaryInFile;
    }

    public void setSummaryInFile(SummaryExportSummary summaryInFile) {
        this.summaryInFile = summaryInFile;
    }

    public List<SummaryExportSummary> getItems() {
        return items;
    }

    public void setItems(List<SummaryExportSummary> items) {
        this.items = items == null ? new ArrayList<>() : items;
    }

    public List<ProjectResponse> getAvailableProjects() {
        return availableProjects;
    }

    public void setAvailableProjects(List<ProjectResponse> availableProjects) {
        this.availableProjects = availableProjects == null ? new ArrayList<>() : availableProjects;
    }

    public List<String> getAvailableEnvironments() {
        return availableEnvironments;
    }

    public void setAvailableEnvironments(List<String> availableEnvironments) {
        this.availableEnvironments = availableEnvironments == null ? new ArrayList<>() : availableEnvironments;
    }
}
