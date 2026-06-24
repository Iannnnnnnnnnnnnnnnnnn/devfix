package com.devfix.ai.dto;

import java.time.LocalDateTime;
import java.util.List;

public class BugSearchResponse {
    private List<BugSearchResult> list;
    private long total;

    public List<BugSearchResult> getList() {
        return list;
    }

    public void setList(List<BugSearchResult> list) {
        this.list = list;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public static class BugSearchResult {
        private Long projectId;
        private String projectName;
        private Long sceneId;
        private String sceneName;
        private Long issueId;
        private String issueName;
        private Long recordId;
        private String hitContent;
        private LocalDateTime recordTime;

        public Long getProjectId() {
            return projectId;
        }

        public void setProjectId(Long projectId) {
            this.projectId = projectId;
        }

        public String getProjectName() {
            return projectName;
        }

        public void setProjectName(String projectName) {
            this.projectName = projectName;
        }

        public Long getSceneId() {
            return sceneId;
        }

        public void setSceneId(Long sceneId) {
            this.sceneId = sceneId;
        }

        public String getSceneName() {
            return sceneName;
        }

        public void setSceneName(String sceneName) {
            this.sceneName = sceneName;
        }

        public Long getIssueId() {
            return issueId;
        }

        public void setIssueId(Long issueId) {
            this.issueId = issueId;
        }

        public String getIssueName() {
            return issueName;
        }

        public void setIssueName(String issueName) {
            this.issueName = issueName;
        }

        public Long getRecordId() {
            return recordId;
        }

        public void setRecordId(Long recordId) {
            this.recordId = recordId;
        }

        public String getHitContent() {
            return hitContent;
        }

        public void setHitContent(String hitContent) {
            this.hitContent = hitContent;
        }

        public LocalDateTime getRecordTime() {
            return recordTime;
        }

        public void setRecordTime(LocalDateTime recordTime) {
            this.recordTime = recordTime;
        }
    }
}
