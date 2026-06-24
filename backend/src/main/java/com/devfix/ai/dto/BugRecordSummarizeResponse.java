package com.devfix.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class BugRecordSummarizeResponse {
    private String aiSummary;
    private String suggestedTitle;
    private String suggestedErrorType;
    private List<String> suggestedTags = new ArrayList<>();

    public String getAiSummary() {
        return aiSummary;
    }

    public void setAiSummary(String aiSummary) {
        this.aiSummary = aiSummary;
    }

    public String getSuggestedTitle() {
        return suggestedTitle;
    }

    public void setSuggestedTitle(String suggestedTitle) {
        this.suggestedTitle = suggestedTitle;
    }

    public String getSuggestedErrorType() {
        return suggestedErrorType;
    }

    public void setSuggestedErrorType(String suggestedErrorType) {
        this.suggestedErrorType = suggestedErrorType;
    }

    public List<String> getSuggestedTags() {
        return suggestedTags;
    }

    public void setSuggestedTags(List<String> suggestedTags) {
        this.suggestedTags = suggestedTags;
    }
}
