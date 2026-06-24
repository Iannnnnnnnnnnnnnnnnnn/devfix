package com.devfix.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class CliCommandResponse {
    private Long historyId;
    private String category;
    private String scenario;
    private List<CliCommandItem> commands = new ArrayList<>();
    private List<String> tips = new ArrayList<>();

    public Long getHistoryId() {
        return historyId;
    }

    public void setHistoryId(Long historyId) {
        this.historyId = historyId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getScenario() {
        return scenario;
    }

    public void setScenario(String scenario) {
        this.scenario = scenario;
    }

    public List<CliCommandItem> getCommands() {
        return commands;
    }

    public void setCommands(List<CliCommandItem> commands) {
        this.commands = commands == null ? new ArrayList<>() : commands;
    }

    public List<String> getTips() {
        return tips;
    }

    public void setTips(List<String> tips) {
        this.tips = tips == null ? new ArrayList<>() : tips;
    }
}
