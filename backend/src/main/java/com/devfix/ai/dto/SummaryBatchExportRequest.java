package com.devfix.ai.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.ArrayList;
import java.util.List;

public class SummaryBatchExportRequest {
    @NotEmpty(message = "ids 不能为空")
    private List<Long> ids = new ArrayList<>();

    public List<Long> getIds() {
        return ids;
    }

    public void setIds(List<Long> ids) {
        this.ids = ids == null ? new ArrayList<>() : ids;
    }
}
