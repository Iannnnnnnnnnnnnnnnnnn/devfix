package com.devfix.ai.controller;

import com.devfix.ai.dto.CommandRecommendRequest;
import com.devfix.ai.dto.CommandRecommendResponse;
import com.devfix.ai.service.CommandService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/command")
public class CommandController {
    private final CommandService commandService;

    public CommandController(CommandService commandService) {
        this.commandService = commandService;
    }

    @PostMapping("/recommend")
    public CommandRecommendResponse recommend(@Valid @RequestBody CommandRecommendRequest request) {
        return commandService.recommend(request);
    }
}
