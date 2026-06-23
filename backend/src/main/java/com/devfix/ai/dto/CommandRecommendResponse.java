package com.devfix.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class CommandRecommendResponse {
    private List<CommandItem> commands = new ArrayList<>();

    public List<CommandItem> getCommands() {
        return commands;
    }

    public void setCommands(List<CommandItem> commands) {
        this.commands = commands == null ? new ArrayList<>() : commands;
    }
}
