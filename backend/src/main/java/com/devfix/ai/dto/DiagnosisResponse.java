package com.devfix.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class DiagnosisResponse {
    private Long id;
    private String summary;
    private String rootCause;
    private List<String> evidence = new ArrayList<>();
    private List<CommandItem> commands = new ArrayList<>();
    private List<String> fixSteps = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();
    private List<String> needMoreInfo = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getRootCause() {
        return rootCause;
    }

    public void setRootCause(String rootCause) {
        this.rootCause = rootCause;
    }

    public List<String> getEvidence() {
        return evidence;
    }

    public void setEvidence(List<String> evidence) {
        this.evidence = evidence == null ? new ArrayList<>() : evidence;
    }

    public List<CommandItem> getCommands() {
        return commands;
    }

    public void setCommands(List<CommandItem> commands) {
        this.commands = commands == null ? new ArrayList<>() : commands;
    }

    public List<String> getFixSteps() {
        return fixSteps;
    }

    public void setFixSteps(List<String> fixSteps) {
        this.fixSteps = fixSteps == null ? new ArrayList<>() : fixSteps;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings == null ? new ArrayList<>() : warnings;
    }

    public List<String> getNeedMoreInfo() {
        return needMoreInfo;
    }

    public void setNeedMoreInfo(List<String> needMoreInfo) {
        this.needMoreInfo = needMoreInfo == null ? new ArrayList<>() : needMoreInfo;
    }
}
