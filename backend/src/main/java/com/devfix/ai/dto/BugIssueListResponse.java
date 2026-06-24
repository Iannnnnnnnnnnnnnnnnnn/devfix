package com.devfix.ai.dto;

import java.util.List;

public class BugIssueListResponse {
    private List<BugIssueResponse> list;
    private long total;

    public List<BugIssueResponse> getList() {
        return list;
    }

    public void setList(List<BugIssueResponse> list) {
        this.list = list;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }
}
