package com.devfix.ai.dto;

public class SummaryExportItem {
    private SummaryExportProject project;
    private SummaryExportScene scene;
    private SummaryExportSummary summary;

    public SummaryExportProject getProject() {
        return project;
    }

    public void setProject(SummaryExportProject project) {
        this.project = project;
    }

    public SummaryExportScene getScene() {
        return scene;
    }

    public void setScene(SummaryExportScene scene) {
        this.scene = scene;
    }

    public SummaryExportSummary getSummary() {
        return summary;
    }

    public void setSummary(SummaryExportSummary summary) {
        this.summary = summary;
    }
}
