package com.devfix.ai.dto;

public class DiagnosisStatsResponse {
    private long todayCount;
    private long totalCount;

    public DiagnosisStatsResponse(long todayCount, long totalCount) {
        this.todayCount = todayCount;
        this.totalCount = totalCount;
    }

    public long getTodayCount() {
        return todayCount;
    }

    public void setTodayCount(long todayCount) {
        this.todayCount = todayCount;
    }

    public long getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(long totalCount) {
        this.totalCount = totalCount;
    }
}
