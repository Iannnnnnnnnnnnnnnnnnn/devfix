package com.devfix.ai.service;

import com.devfix.ai.domain.entity.DevaiProject;
import com.devfix.ai.dto.ProjectRequest;
import com.devfix.ai.dto.ProjectResponse;
import com.devfix.ai.exception.AppException;
import com.devfix.ai.mapper.DevaiProjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProjectService {
    private final DevaiProjectMapper projectMapper;

    public ProjectService(DevaiProjectMapper projectMapper) {
        this.projectMapper = projectMapper;
    }

    public List<ProjectResponse> listProjects() {
        return projectMapper.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProjectResponse createProject(ProjectRequest request) {
        String name = defaultText(request.getName(), "");
        DevaiProject existing = projectMapper.findByName(name);
        if (existing != null) {
            return toResponse(existing);
        }
        DevaiProject project = new DevaiProject();
        project.setName(name);
        project.setDescription(defaultText(request.getDescription(), ""));
        projectMapper.insert(project);
        return toResponse(projectMapper.findById(project.getId()));
    }

    public DevaiProject resolveProject(Long projectId, String projectName) {
        if (projectId != null) {
            DevaiProject project = projectMapper.findById(projectId);
            if (project == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "项目不存在");
            }
            return project;
        }
        if (projectName == null || projectName.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "projectId 不能为空");
        }
        String name = projectName.trim();
        DevaiProject project = projectMapper.findByName(name);
        if (project != null) {
            return project;
        }
        ProjectRequest request = new ProjectRequest();
        request.setName(name);
        request.setDescription("");
        ProjectResponse created = createProject(request);
        return projectMapper.findById(created.getId());
    }

    public DevaiProject requireProject(Long projectId) {
        DevaiProject project = projectMapper.findById(projectId);
        if (project == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "项目不存在");
        }
        return project;
    }

    private ProjectResponse toResponse(DevaiProject project) {
        ProjectResponse response = new ProjectResponse();
        response.setId(project.getId());
        response.setName(project.getName());
        response.setDescription(project.getDescription());
        response.setCreatedAt(project.getCreatedAt());
        response.setUpdatedAt(project.getUpdatedAt());
        return response;
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
