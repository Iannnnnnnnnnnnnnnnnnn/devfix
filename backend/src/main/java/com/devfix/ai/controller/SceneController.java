package com.devfix.ai.controller;

import com.devfix.ai.dto.ApiResponse;
import com.devfix.ai.dto.SceneRequest;
import com.devfix.ai.dto.SceneResponse;
import com.devfix.ai.service.SceneService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/scenes")
public class SceneController {
    private final SceneService sceneService;

    public SceneController(SceneService sceneService) {
        this.sceneService = sceneService;
    }

    @PutMapping("/{sceneId}")
    public ApiResponse<SceneResponse> update(@PathVariable Long sceneId,
                                             @Valid @RequestBody SceneRequest request) {
        return ApiResponse.ok(sceneService.updateScene(sceneId, request));
    }

    @DeleteMapping("/{sceneId}")
    public ApiResponse<Void> delete(@PathVariable Long sceneId) {
        sceneService.deleteScene(sceneId);
        return ApiResponse.ok("已删除", null);
    }
}
