package com.devfix.ai.controller;

import com.devfix.ai.dto.ApiResponse;
import com.devfix.ai.dto.CliCommandRequest;
import com.devfix.ai.dto.CliCommandResponse;
import com.devfix.ai.service.CliService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cmd")
public class CliCommandController {
    private final CliService cliService;

    public CliCommandController(CliService cliService) {
        this.cliService = cliService;
    }

    @PostMapping("/search")
    public ApiResponse<CliCommandResponse> search(@Valid @RequestBody CliCommandRequest request) {
        return ApiResponse.ok(cliService.searchCommand(request));
    }
}
