package com.devfix.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class HistoryListResponse {
    private List<HistorySummaryResponse> list = new ArrayList<>();

    public List<HistorySummaryResponse> getList() {
        return list;
    }

    public void setList(List<HistorySummaryResponse> list) {
        this.list = list == null ? new ArrayList<>() : list;
    }
}
