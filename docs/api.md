# API 文档

默认后端地址：`http://localhost:8088`

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
  "keyword": "docker logs",
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
