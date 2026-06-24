package com.devfix.ai.dto;

public class SummaryExportFile {
    private String format = "devai-summary-doc";
    private String version = "1.0";
    private String exportedAt;
    private SummaryExportProject project;
    private SummaryExportScene scene;
    private SummaryExportSummary summary;

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

    public String getExportedAt() {
        return exportedAt;
    }

    public void setExportedAt(String exportedAt) {
        this.exportedAt = exportedAt;
    }

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
