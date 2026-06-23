package com.devfix.ai.controller;

import com.devfix.ai.dto.ApiResponse;
import com.devfix.ai.dto.KnowledgeGenerateRequest;
import com.devfix.ai.dto.KnowledgeGenerateResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    @PostMapping("/generate")
    public ApiResponse<KnowledgeGenerateResponse> generate(@RequestBody(required = false) KnowledgeGenerateRequest request) {
        return ApiResponse.ok(new KnowledgeGenerateResponse("知识文档整理功能已预留，后续版本完善"));
    }
}
