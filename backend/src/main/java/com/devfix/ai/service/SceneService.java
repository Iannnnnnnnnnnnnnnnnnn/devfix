package com.devfix.ai.service;

import com.devfix.ai.domain.entity.DevaiScene;
import com.devfix.ai.dto.SceneRequest;
import com.devfix.ai.dto.SceneResponse;
import com.devfix.ai.exception.AppException;
import com.devfix.ai.mapper.BugIssueMapper;
import com.devfix.ai.mapper.CommandHistoryMapper;
import com.devfix.ai.mapper.DevaiSceneMapper;
import com.devfix.ai.mapper.LogAnalysisHistoryMapper;
import com.devfix.ai.mapper.SummaryDocMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SceneService {
    private final ProjectService projectService;
    private final DevaiSceneMapper sceneMapper;
    private final LogAnalysisHistoryMapper logHistoryMapper;
    private final CommandHistoryMapper commandHistoryMapper;
    private final SummaryDocMapper summaryDocMapper;
    private final BugIssueMapper bugIssueMapper;

    public SceneService(ProjectService projectService,
                        DevaiSceneMapper sceneMapper,
                        LogAnalysisHistoryMapper logHistoryMapper,
                        CommandHistoryMapper commandHistoryMapper,
                        SummaryDocMapper summaryDocMapper,
                        BugIssueMapper bugIssueMapper) {
        this.projectService = projectService;
        this.sceneMapper = sceneMapper;
        this.logHistoryMapper = logHistoryMapper;
        this.commandHistoryMapper = commandHistoryMapper;
        this.summaryDocMapper = summaryDocMapper;
        this.bugIssueMapper = bugIssueMapper;
    }

    public List<SceneResponse> listScenes(Long projectId) {
        projectService.requireProject(projectId);
        return sceneMapper.findByProjectId(projectId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public SceneResponse createScene(Long projectId, SceneRequest request) {
        projectService.requireProject(projectId);
        String name = requireName(request.getName());
        DevaiScene existing = sceneMapper.findByProjectIdAndName(projectId, name);
        if (existing != null) {
            return toResponse(existing);
        }
        DevaiScene scene = new DevaiScene();
        scene.setProjectId(projectId);
        scene.setName(name);
        scene.setDescription(defaultText(request.getDescription(), ""));
        sceneMapper.insert(scene);
        return toResponse(sceneMapper.findById(scene.getId()));
    }

    @Transactional
    public SceneResponse updateScene(Long sceneId, SceneRequest request) {
        DevaiScene scene = requireScene(sceneId);
        String name = requireName(request.getName());
        DevaiScene duplicated = sceneMapper.findByProjectIdAndName(scene.getProjectId(), name);
        if (duplicated != null && !duplicated.getId().equals(sceneId)) {
            throw new AppException(HttpStatus.CONFLICT, "同一项目下已存在同名场景");
        }
        scene.setName(name);
        scene.setDescription(defaultText(request.getDescription(), ""));
        sceneMapper.update(scene);
        return toResponse(sceneMapper.findById(sceneId));
    }

    @Transactional
    public void deleteScene(Long sceneId) {
        DevaiScene scene = requireScene(sceneId);
        long usageCount = logHistoryMapper.countBySceneId(sceneId)
                + commandHistoryMapper.countBySceneId(sceneId)
                + summaryDocMapper.countBySceneId(sceneId)
                + bugIssueMapper.countBySceneId(sceneId);
        if (usageCount > 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "该场景下已有日志分析历史、命令历史、总结文档或 Bug 档案，不允许直接删除");
        }
        sceneMapper.deleteById(scene.getId());
    }

    public DevaiScene requireScene(Long sceneId) {
        DevaiScene scene = sceneMapper.findById(sceneId);
        if (scene == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "场景不存在");
        }
        return scene;
    }

    public DevaiScene requireSceneInProject(Long projectId, Long sceneId) {
        projectService.requireProject(projectId);
        DevaiScene scene = requireScene(sceneId);
        if (!projectId.equals(scene.getProjectId())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "场景不属于当前项目");
        }
        return scene;
    }

    public DevaiScene resolveScene(Long projectId, Long sceneId, String sceneName) {
        if (sceneId != null) {
            return requireSceneInProject(projectId, sceneId);
        }
        String name = requireName(sceneName);
        DevaiScene scene = sceneMapper.findByProjectIdAndName(projectId, name);
        if (scene != null) {
            return scene;
        }
        SceneRequest request = new SceneRequest();
        request.setName(name);
        request.setDescription("");
        SceneResponse created = createScene(projectId, request);
        return sceneMapper.findById(created.getId());
    }

    public SceneResponse toResponse(DevaiScene scene) {
        SceneResponse response = new SceneResponse();
        response.setId(scene.getId());
        response.setProjectId(scene.getProjectId());
        response.setName(scene.getName());
        response.setDescription(scene.getDescription());
        response.setCreatedAt(scene.getCreatedAt());
        response.setUpdatedAt(scene.getUpdatedAt());
        return response;
    }

    private String requireName(String value) {
        if (value == null || value.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "场景名称不能为空");
        }
        return value.trim();
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
