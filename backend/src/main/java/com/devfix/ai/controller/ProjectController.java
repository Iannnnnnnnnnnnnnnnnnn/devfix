package com.devfix.ai.controller;

import com.devfix.ai.dto.ApiResponse;
import com.devfix.ai.dto.ProjectRequest;
import com.devfix.ai.dto.ProjectResponse;
import com.devfix.ai.dto.SceneRequest;
import com.devfix.ai.dto.SceneResponse;
import com.devfix.ai.service.ProjectService;
import com.devfix.ai.service.SceneService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectService projectService;
    private final SceneService sceneService;

    public ProjectController(ProjectService projectService,
                             SceneService sceneService) {
        this.projectService = projectService;
        this.sceneService = sceneService;
    }

    @GetMapping
    public ApiResponse<List<ProjectResponse>> list() {
        return ApiResponse.ok(projectService.listProjects());
    }

    @PostMapping
    public ApiResponse<ProjectResponse> create(@Valid @RequestBody ProjectRequest request) {
        return ApiResponse.ok(projectService.createProject(request));
    }

    @GetMapping("/{projectId}/scenes")
    public ApiResponse<List<SceneResponse>> scenes(@PathVariable Long projectId) {
        return ApiResponse.ok(sceneService.listScenes(projectId));
    }

    @PostMapping("/{projectId}/scenes")
    public ApiResponse<SceneResponse> createScene(@PathVariable Long projectId,
                                                  @Valid @RequestBody SceneRequest request) {
        return ApiResponse.ok(sceneService.createScene(projectId, request));
    }
}
