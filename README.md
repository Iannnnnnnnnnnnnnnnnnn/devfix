# devfix-ai

本地 Web + CLI/TUI 版 AI 开发排错助手。用户可以分析报错日志、查询开发命令，并按项目沉淀历史记录；命令历史还能按项目和所属环境分组，后续可手动触发 AI 生成 Markdown 总结文档。

## 技术栈

- 前端：React、Vite、TypeScript
- 后端：Java 17、Spring Boot、MyBatis、Maven
- 数据库：MySQL
- AI：DeepSeek API

## 目录结构

```text
devfix-ai
├── backend
├── devai-cli
├── web
├── docs
│   ├── api.md
│   ├── database.sql
│   └── prompt.md
└── README.md
```

## 本地启动

### 1. 创建数据库并建表

```bash
mysql -uroot -p
CREATE DATABASE devfix_ai DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE devfix_ai;
source docs/database.sql;
```

也可以在项目根目录执行 `docs/database.sql` 中的完整 SQL。

本项目需要的核心表：

- `diagnosis_record`：Web 版日志分析主记录。
- `diagnosis_result`：Web 版分析结果明细。
- `devai_analysis_history`：CLI / TUI 分析和命令查询历史。
- `devai_project`：项目 / 技术域列表，由用户创建维护，系统不内置默认项目。
- `devai_scene`：项目 / 技术域下的场景，由用户创建维护，系统不内置默认场景。
- `devai_log_analysis_history`：日志分析历史，按项目 / 技术域和场景分组。
- `devai_command_history`：命令查询历史，按项目 / 技术域和场景分组。
- `devai_summary_doc`：手动触发生成的总结文档。
- `devai_knowledge_doc`：知识文档整理预留表。

### 2. 配置环境变量

Windows PowerShell：

```powershell
$env:DEEPSEEK_API_KEY="你的Key"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="你的MySQL密码"
```

Linux / macOS：

```bash
export DEEPSEEK_API_KEY="你的Key"
export DB_USERNAME="root"
export DB_PASSWORD="你的MySQL密码"
```

DeepSeek 相关配置：

```bash
export DEEPSEEK_API_KEY="你的DeepSeek API Key"
export DEEPSEEK_BASE_URL="https://api.deepseek.com"
export DEEPSEEK_MODEL="deepseek-chat"
```

Windows PowerShell：

```powershell
$env:DEEPSEEK_API_KEY="你的DeepSeek API Key"
$env:DEEPSEEK_BASE_URL="https://api.deepseek.com"
$env:DEEPSEEK_MODEL="deepseek-chat"
```

默认配置：

- 后端端口：`8088`
- 前端端口：`5191`
- MySQL：`localhost:3306/devfix_ai`
- DeepSeek Base URL：`https://api.deepseek.com`
- DeepSeek Model：`deepseek-v4-flash`

如需覆盖数据库地址：

```bash
export DB_URL="jdbc:mysql://localhost:3306/devfix_ai?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false"
```

### 3. 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端访问地址：

```text
http://localhost:8088
```

### 4. 启动前端

```bash
cd web
npm install
npm run dev
```

前端访问地址：

```text
http://localhost:5191
```

如需指定后端地址：

```bash
VITE_API_BASE_URL=http://localhost:8088 npm run dev
```

### 5. 安装 CLI

```bash
cd devai-cli
npm install
npm run build
npm link
```

安装后可以直接使用：

```bash
devai --help
```

CLI 默认后端地址为 `http://localhost:8088`，和当前后端端口保持一致。也可以通过环境变量覆盖：

```bash
DEVAI_API_BASE_URL=http://localhost:8088 devai cmd docker
```

Windows PowerShell：

```powershell
$env:DEVAI_API_BASE_URL="http://localhost:8088"
devai cmd docker
```

后续可扩展本地配置文件：

```json
{
  "apiBaseUrl": "http://localhost:8088",
  "defaultModel": "deepseek-chat",
  "debug": false,
  "autoSaveHistory": true
}
```

配置文件路径：`~/.devai/config.json`。

## CLI 使用

### 粘贴日志分析

```bash
devai paste
devai paste --project DevAI
```

输入日志后，用 `EOF`、`---END---` 或 Ctrl+D 结束输入。

JSON 输出：

```bash
devai paste --json
```

### 查询常用命令

```bash
devai cmd docker
devai cmd docker logs --project DevAI --scene 本地启动排查
devai cmd mysql
devai cmd linux log
devai cmd nginx
devai cmd git rollback
devai cmd java process
```

JSON 输出：

```bash
devai cmd docker --json
```

### 分析本地日志文件

```bash
devai analyze --file ./logs/error.log
devai analyze --file ./logs/error.log --project DevAI
```

项目管理：

```bash
devai project list
devai project create DevAI
```

TUI 测试示例：

```bash
devai tui
```

```bash
devai tui --api http://localhost:8088 --debug
```

```bash
devai tui --json-log
```

支持 `.log`、`.txt`、`.out` 文件。小于 200KB 的文件会直接读取全文；大文件会优先提取包含 `ERROR`、`Exception`、`Caused by`、`Traceback`、`panic`、`fatal`、`failed` 的关键片段，提取不到时读取末尾 500 行。

JSON 输出：

```bash
devai analyze --file ./logs/error.log --json
```

## TUI 使用方式

先启动后端：

```bash
cd backend
mvn spring-boot:run
```

安装并启动 TUI：

```bash
cd devai-cli
npm install
npm run build
npm link
devai tui
```

指定后端地址：

```bash
DEVAI_API_BASE_URL=http://localhost:8088 devai tui
```

也可以只对本次 TUI 会话覆盖：

```bash
devai tui --api http://localhost:8088
```

调试和操作日志：

```bash
devai tui --debug
devai tui --json-log
```

`--json-log` 会写入 `~/.devai/tui-logs.jsonl`。

TUI 主菜单包含：

1. 粘贴报错日志分析
2. 查询常用开发命令
3. 分析本地日志文件
4. 查看历史记录
5. 总结文档
6. 配置后端地址 / 模型
7. 退出

进入日志分析、命令查询、文件分析、历史记录、总结文档前，TUI 会先选择项目；命令查询和命令总结会选择环境，跳过环境时按 `Other` 处理。

快捷键：

- `↑/↓`：选择菜单
- `Enter`：确认
- `Esc` 或 `b`：返回
- `q`：退出
- `Ctrl+C`：强制退出

TUI 仍然只调用本地后端 API，不会直接调用 DeepSeek，也不会保存 API Key。

### 本地测试示例

```bash
devai cmd docker
```

```bash
printf "java.lang.IllegalStateException: demo\nCaused by: config missing\nEOF\n" | devai paste
```

```bash
devai analyze --file ./logs/error.log
```

## API 示例

日志分析：

```bash
curl -X POST http://localhost:8088/api/diagnosis/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "lifelink",
    "errorType": "spring",
    "environment": "local",
    "logContent": "报错日志内容"
}'
```

CLI 日志分析兼容接口：

```bash
curl -X POST http://localhost:8088/api/analyze/log \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 1,
    "content": "报错日志内容",
    "source": "cli-paste"
  }'
```

CLI 文件分析兼容接口：

```bash
curl -X POST http://localhost:8088/api/analyze/file \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 1,
    "fileName": "error.log",
    "content": "文件中提取出的关键日志内容",
    "source": "cli-file"
  }'
```

命令助手：

```bash
curl -X POST http://localhost:8088/api/command/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "question": "查看 nginx 最近 200 行错误日志",
    "environment": "linux"
}'
```

CLI 命令查询兼容接口：

```bash
curl -X POST http://localhost:8088/api/cmd/search \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 1,
    "environment": "Docker",
    "keyword": "docker logs",
    "question": "如何实时查看 Docker 容器日志",
    "source": "cli-cmd"
  }'
```

项目列表：

```bash
curl http://localhost:8088/api/projects
```

创建项目：

```bash
curl -X POST http://localhost:8088/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"DevAI","description":"AI 报错分析助手"}'
```

日志分析历史：

```bash
curl "http://localhost:8088/api/history/logs?projectId=1&page=1&pageSize=20"
```

命令查询历史：

```bash
curl "http://localhost:8088/api/history/commands?projectId=1&environment=Docker&page=1&pageSize=20"
```

手动生成命令总结：

```bash
curl -X POST http://localhost:8088/api/summary/commands/generate \
  -H "Content-Type: application/json" \
  -d '{"projectId":1,"environment":"Docker"}'
```

手动生成日志问题报告：

```bash
curl -X POST http://localhost:8088/api/summary/logs/generate \
  -H "Content-Type: application/json" \
  -d '{"projectId":1}'
```

总结文档列表：

```bash
curl "http://localhost:8088/api/summary/docs?projectId=1&type=command"
```

详情：

```bash
curl http://localhost:8088/api/diagnosis/1
```

## 注意事项

- `DEEPSEEK_API_KEY` 只从环境变量读取，代码中没有写死 Key。
- 系统只推荐 Linux 命令，不会自动执行任何命令。
- 命令风险等级包括 `safe`、`warning`、`danger`、`blocked`。
- 后端会对日志中包含 `password=`、`token=`、`secret=`、`Authorization` 的内容做基础脱敏后再保存。
- 日志过长时，发送给 AI 的内容会保留前后片段，中间部分截断；数据库保存脱敏后的完整日志。
- CLI 不直接调用 AI API，只调用本地后端接口。
- Web、CLI、TUI 的日志分析会写入 `devai_log_analysis_history`。
- Web、CLI、TUI 的命令查询会写入 `devai_command_history`。
- 命令总结和日志问题报告只通过 Web/TUI/接口手动触发，AI API 仍只由后端调用。
- TUI 配置文件不存在时会自动创建 `~/.devai/config.json`。

## 本地测试命令

```bash
curl http://localhost:8088/api/projects
devai project list
devai project create DevAI
devai scene create --project DevAI --name 本地启动排查
devai cmd docker logs --project DevAI --scene 本地启动排查
devai analyze --file ./logs/error.log --project DevAI --scene 本地启动排查
curl "http://localhost:8088/api/history/commands?projectId=1&sceneId=2"
curl -X POST http://localhost:8088/api/summary/commands/generate -H "Content-Type: application/json" -d "{\"projectId\":1,\"environment\":\"Docker\"}"
```

## 总结文档导入导出

Web 后台进入“总结文档”页面后，可以：

- 点击单条记录的“导出”，下载 `.devai-summary.json` 文件。
- 勾选多条记录后点击“批量导出”，下载批量 JSON 文件。
- 点击“导入总结文档”，选择 `.devai-summary.json` 文件，先解析预览，再确认项目、总结类型、环境、标题和标签后导入。

导入时需要重新选择项目和环境，因为导出文件里的 `project.id` 来自另一套数据库时可能不一致。最终保存使用当前系统里的 `projectId`，不会信任导入文件中的项目 id。

导入导出统一使用 JSON 格式：

```json
{
  "format": "devai-summary-doc",
  "version": "1.0",
  "exportedAt": "2026-06-24 18:30:00",
  "project": {
    "id": 1,
    "name": "DevAI",
    "description": "AI 报错分析助手"
  },
  "summary": {
    "id": 1001,
    "summaryType": "command",
    "environment": "Docker",
    "title": "Docker 常用命令总结",
    "content": "# Docker 常用命令总结\n\n...",
    "tags": ["Docker", "日志排查"],
    "sourceCount": 12,
    "sourceIds": [1, 2, 3],
    "modelName": "deepseek-chat"
  }
}
```

CLI 导出：

```bash
devai summary export --id 1001 --output ./docker-summary.devai-summary.json
```

CLI 导入：

```bash
devai summary import --file ./docker-summary.devai-summary.json --project DevAI --scene 本地启动排查 --type command
```

常见错误：

- 文件超过 5MB：拆分后再导入。
- `format` 或 `version` 不正确：确认文件来自 DevAI 总结文档导出功能。
- 导入总结缺少场景：选择场景或传 `--scene`。
- 检测到重复：Web 可勾选“仍然导入可能重复的文档”，CLI 可加 `--allow-duplicate`。

## Bug 档案 / 排查记录

Web 后台将 Bug 模块拆成两个入口：

- `Bug 档案`：只负责查询、筛选、列表展示和查看详情，路由为 `/bug/archive`。
- `新建 Bug`：负责创建 Bug 问题、输入排查过程、AI 整理和保存归档，路由为 `/bug/new`。

Bug 档案页使用“顶部搜索区 + 左侧问题类型 + 右侧问题列表”的结构：

- 顶部支持按项目、场景、关键词、状态、错误类型、标签筛选。
- 左侧问题类型从已有 Bug 档案的 `error_type` 聚合，不内置默认类型。
- 问题名称或“查看详情”进入 `/bug/archive/{id}`。
- 详情页按“Bug 档案 / 项目 / 场景 / 问题名称”展示概要和排查记录时间线。
- 在详情页点击“新增排查记录”会跳转到 `/bug/new?issueId={id}` 继续归档。

数据库新增两张表：

- `devai_bug_issue`：保存问题名称、状态、错误类型、标签、摘要和关联预留字段。
- `devai_bug_investigation_record`：保存原始输入、AI 总结、最终归档内容、来源和模型名。

CLI 命令：

```bash
devai bug create --project DevAI --name "后端启动失败：8088 端口被占用"
devai bug note --project DevAI --issue "后端启动失败：8088 端口被占用"
devai bug search "8088 端口" --project DevAI
```

TUI 主菜单新增“Bug 排查记录”，提供新建问题、记录排查过程、查看档案和搜索档案入口。

AI API 仍然只由后端调用，前端、CLI、TUI 都不会读取或传递 AI API Key。

## TUI 常见问题

1. `devai` 命令不存在：进入 `devai-cli` 执行 `npm install && npm run build && npm link`。
2. 无法连接后端：确认 `cd backend && mvn spring-boot:run` 已启动，并检查 `DEVAI_API_BASE_URL` 或 `~/.devai/config.json`。
3. Windows 下路径包含中文或空格：在 TUI 中直接粘贴完整路径；命令行里建议用英文双引号包裹路径。
4. 日志文件过大：CLI / TUI 最大读取 10MB，超过后先手动截取关键日志。
5. TUI 显示乱码：确认终端编码为 UTF-8，Windows Terminal / PowerShell 里可先执行 `chcp 65001`。

## 上传到 GitHub

首次上传：

```bash
git init
git add .
git commit -m "init devfix-ai"
git branch -M main
git remote add origin https://github.com/你的用户名/devfix-ai.git
git push -u origin main
```

如果 GitHub 仓库已经存在，只需要把 `origin` 换成你的仓库地址。

项目已包含：

- `.gitignore`：排除 `node_modules`、`dist`、`target`、IDE 配置、本地 `.env`。
- `.gitattributes`：统一文本文件换行为 LF，避免跨平台换行污染。
- `.editorconfig`：统一基础缩进和编码。
- `.env.example`：只提供环境变量示例，不提交真实密钥。
- `.github/workflows/ci.yml`：GitHub Actions 会在 push / pull request 时构建后端和前端。
