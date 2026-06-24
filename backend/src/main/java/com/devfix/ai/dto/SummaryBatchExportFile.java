package com.devfix.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class SummaryBatchExportFile {
    private String format = "devai-summary-doc-batch";
    private String version = "1.0";
    private String exportedAt;
    private List<SummaryExportItem> items = new ArrayList<>();

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

    public List<SummaryExportItem> getItems() {
        return items;
    }

    public void setItems(List<SummaryExportItem> items) {
        this.items = items == null ? new ArrayList<>() : items;
    }
}
