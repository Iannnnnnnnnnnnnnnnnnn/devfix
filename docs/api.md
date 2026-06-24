# API 文档

默认后端地址：`http://localhost:8088`

## 项目管理

`GET /api/projects`

返回用户创建的项目 / 技术域列表。系统不会内置默认项目。

`POST /api/projects`

```json
{
  "name": "DevAI",
  "description": "AI 报错分析助手"
}
```

`GET /api/projects/{projectId}/scenes`

查询项目 / 技术域下的场景。

`POST /api/projects/{projectId}/scenes`

```json
{
  "name": "本地启动排查",
  "description": "用户自定义场景"
}
```

## 日志分析

`POST /api/diagnosis/analyze`

请求：

```json
{
  "projectName": "lifelink",
  "errorType": "spring",
  "environment": "local",
  "logContent": "报错日志内容"
}
```

响应：

```json
{
  "id": 1,
  "summary": "报错结论",
  "rootCause": "最可能原因",
  "evidence": ["关键证据1"],
  "commands": [
    {
      "command": "grep -n \"@Transactional\" -R ./src/main/java",
      "description": "搜索事务注解",
      "riskLevel": "safe",
      "readonly": true
    }
  ],
  "fixSteps": ["修复步骤1"],
  "warnings": ["风险提醒"],
  "needMoreInfo": ["还需要补充的信息"]
}
```

## 历史记录

`GET /api/diagnosis/history`

返回最近 50 条分析记录。

## 分析详情

`GET /api/diagnosis/{id}`

返回某一次完整分析结果，包含原始日志。

## 统计

`GET /api/diagnosis/stats`

```json
{
  "todayCount": 3,
  "totalCount": 25
}
```

## Linux 命令助手

`POST /api/command/recommend`

请求：

```json
{
  "question": "查看 nginx 最近 200 行错误日志",
  "environment": "linux"
}
```

响应：

```json
{
  "commands": [
    {
      "command": "journalctl -u nginx -n 200 --no-pager",
      "description": "查看 nginx 服务最近 200 行日志",
      "riskLevel": "safe",
      "readonly": true
    }
  ]
}
```

## CLI / TUI 日志分析

`POST /api/analyze/log`

请求：

```json
{
  "projectId": 1,
  "sceneId": 2,
  "content": "报错日志内容",
  "source": "tui-paste",
  "modelName": "deepseek-chat"
}
```

响应：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": 1,
    "historyId": 1001,
    "errorType": "Spring Boot 启动失败",
    "cause": "application.yml 中存在 Git 冲突标记",
    "keyLines": ["<<<<<<< HEAD"],
    "impact": "服务无法启动",
    "solution": ["删除 Git 冲突标记", "重新启动服务"],
    "commands": ["grep -n \"<<<<<<<\\|=======\\|>>>>>>>\" application.yml"],
    "knowledge": ["YAML 文件不能包含 Git 冲突标记"]
  }
}
```

## CLI / TUI 文件分析

`POST /api/analyze/file`

请求：

```json
{
  "projectId": 1,
  "fileName": "error.log",
  "content": "文件中提取出的关键日志内容",
  "source": "tui-file",
  "modelName": "deepseek-chat"
}
```

响应格式同 `/api/analyze/log`。

## CLI / TUI 命令查询

`POST /api/cmd/search`

请求：

```json
{
  "projectId": 1,
  "environment": "Docker",
  "keyword": "docker logs",
  "question": "如何实时查看 Docker 容器日志",
  "source": "tui-cmd",
  "modelName": "deepseek-chat"
}
```

响应：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "category": "Docker",
    "scenario": "docker logs",
    "historyId": 2001,
    "commands": [
      {
        "command": "docker logs -f 容器名",
        "description": "实时查看容器日志",
        "example": "docker logs -f 容器名"
      }
    ],
    "tips": []
  }
}
```

## 分组历史记录

日志分析历史：

`GET /api/history/logs?projectId=1&page=1&pageSize=20`

支持参数：`projectId`、`errorType`、`keyword`、`startTime`、`endTime`。

命令查询历史：

`GET /api/history/commands?projectId=1&environment=Docker&page=1&pageSize=20`

支持参数：`projectId`、`environment`、`keyword`、`startTime`、`endTime`。

## 手动总结

手动生成命令总结：

`POST /api/summary/commands/generate`

```json
{
  "projectId": 1,
  "environment": "Docker"
}
```

手动生成日志问题报告：

`POST /api/summary/logs/generate`

```json
{
  "projectId": 1
}
```

查看总结文档：

`GET /api/summary/docs?projectId=1&type=command`

`GET /api/summary/docs/{id}`

导出单个总结文档：

`GET /api/summary/docs/{id}/export`

批量导出总结文档：

`POST /api/summary/docs/export`

```json
{
  "ids": [1, 2, 3]
}
```

导入预览：

`POST /api/summary/docs/import/preview`

请求类型：`multipart/form-data`，字段：`file`。

确认导入：

`POST /api/summary/docs/import/confirm`

请求类型：`multipart/form-data`，字段：`file`、`projectId`、`summaryType`、`environment`、`title`、`tags`、`allowDuplicate`。

## TUI 最近历史

`GET /api/history/recent?limit=20`

响应：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 1,
        "source": "tui-paste",
        "summary": "Spring Boot YAML 解析失败",
        "errorType": "Spring Boot 启动失败",
        "createdAt": "2026-06-23T18:30:00"
      }
    ]
  }
}
```

## TUI 历史详情

`GET /api/history/{id}`

返回 `devai_analysis_history` 中的一条完整记录。

## TUI 删除历史

`DELETE /api/history/{id}`

响应：

```json
{
  "success": true,
  "message": "已删除",
  "data": null
}
```

## 知识文档整理占位

`POST /api/knowledge/generate`

请求：

```json
{
  "source": "tui-manual"
}
```

响应：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "message": "知识文档整理功能已预留，后续版本完善"
  }
}
```
# Bug 档案接口

## 创建 Bug 问题

`POST /api/bug/issues`

```json
{
  "projectId": 1,
  "sceneId": 2,
  "issueName": "后端启动失败：8088 端口被占用",
  "errorType": "Spring Boot 启动失败",
  "tags": ["Spring Boot", "端口占用"],
  "status": "open"
}
```

返回：

```json
{ "success": true, "message": "ok", "data": { "id": 1001 } }
```

## 查询 Bug 问题列表

`GET /api/bug/issues?projectId=1&keyword=8088&status=open&errorType=Spring&tag=端口&page=1&pageSize=20`

返回 `data.list` 和 `data.total`，列表项包含项目、问题名称、状态、错误类型、标签、摘要、更新时间。

## 查询问题类型

`GET /api/bug/issue-types?projectId=1&sceneId=2`

从已有 Bug 档案的 `error_type` 聚合，返回错误类型和数量，不返回内置默认类型。

```json
{
  "success": true,
  "message": "ok",
  "data": [
    { "errorType": "Spring Boot 启动失败", "count": 5 },
    { "errorType": "MySQL 连接异常", "count": 3 }
  ]
}
```

## 查看 / 更新 / 删除 Bug 问题

- `GET /api/bug/issues/{id}`
- `PUT /api/bug/issues/{id}`
- `DELETE /api/bug/issues/{id}`

详情返回问题基础信息和 `records` 排查记录列表。

## AI 整理排查过程

`POST /api/bug/investigations/summarize`

```json
{
  "projectId": 1,
  "issueId": 1001,
  "rawContent": "用户白话输入的排查过程",
  "source": "web"
}
```

该接口只返回 AI 生成的 Markdown 预览，不直接归档。

## 保存最终排查记录

`POST /api/bug/investigations`

```json
{
  "projectId": 1,
  "issueId": 1001,
  "rawContent": "用户白话输入内容",
  "aiSummary": "# Bug 排查记录...",
  "finalContent": "# Bug 排查记录...",
  "source": "web",
  "status": "resolved",
  "errorType": "Spring Boot 启动失败",
  "tags": ["Spring Boot", "端口占用"]
}
```

## 搜索 Bug 档案

`GET /api/bug/search?projectId=1&keyword=8088&errorType=Spring&tag=端口&page=1&pageSize=20`

搜索项目名称、问题名称、错误类型、标签、原始记录、AI 总结和最终归档内容，返回项目 / 问题 / 命中内容层级。
