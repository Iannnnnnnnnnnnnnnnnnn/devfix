package com.devfix.ai.controller;

import com.devfix.ai.dto.CliAnalyzeRequest;
import com.devfix.ai.dto.CliAnalyzeResponse;
import com.devfix.ai.service.CliService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analyze")
public class CliAnalyzeController {
    private final CliService cliService;

    public CliAnalyzeController(CliService cliService) {
        this.cliService = cliService;
    }

    @PostMapping("/log")
    public CliAnalyzeResponse analyzeLog(@Valid @RequestBody CliAnalyzeRequest request) {
        return cliService.analyzeLog(request);
    }

    @PostMapping("/file")
    public CliAnalyzeResponse analyzeFile(@Valid @RequestBody CliAnalyzeRequest request) {
        return cliService.analyzeFile(request);
    }
}
