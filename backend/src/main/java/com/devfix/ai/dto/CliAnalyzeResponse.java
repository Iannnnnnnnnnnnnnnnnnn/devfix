package com.devfix.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class CliAnalyzeResponse {
    private Long id;
    private String errorType;
    private String cause;
    private List<String> keyLines = new ArrayList<>();
    private String impact;
    private List<String> solution = new ArrayList<>();
    private List<String> commands = new ArrayList<>();
    private List<String> knowledge = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getErrorType() {
        return errorType;
    }

    public void setErrorType(String errorType) {
        this.errorType = errorType;
    }

    public String getCause() {
        return cause;
    }

    public void setCause(String cause) {
        this.cause = cause;
    }

    public List<String> getKeyLines() {
        return keyLines;
    }

    public void setKeyLines(List<String> keyLines) {
        this.keyLines = keyLines == null ? new ArrayList<>() : keyLines;
    }

    public String getImpact() {
        return impact;
    }

    public void setImpact(String impact) {
        this.impact = impact;
    }

    public List<String> getSolution() {
        return solution;
    }

    public void setSolution(List<String> solution) {
        this.solution = solution == null ? new ArrayList<>() : solution;
    }

    public List<String> getCommands() {
        return commands;
    }

    public void setCommands(List<String> commands) {
        this.commands = commands == null ? new ArrayList<>() : commands;
    }

    public List<String> getKnowledge() {
        return knowledge;
    }

    public void setKnowledge(List<String> knowledge) {
        this.knowledge = knowledge == null ? new ArrayList<>() : knowledge;
    }
}
