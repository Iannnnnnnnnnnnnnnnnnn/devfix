# devfix-ai

本地 Web 版 AI 开发排错助手。用户粘贴开发报错日志后，后端调用 DeepSeek API 生成排错结论、关键证据、可能原因、排查命令、修复步骤和风险提醒，并将分析结果保存到 MySQL。

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
│   ├── tui-migration.sql
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

如果已经建过旧表，只需要执行 TUI 增量 SQL：

```bash
mysql -uroot -p devfix_ai < docs/tui-migration.sql
```

本项目需要的核心表：

- `diagnosis_record`：Web 版日志分析主记录。
- `diagnosis_result`：Web 版分析结果明细。
- `devai_analysis_history`：CLI / TUI 分析和命令查询历史。
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
```

输入日志后，用 `EOF`、`---END---` 或 Ctrl+D 结束输入。

JSON 输出：

```bash
devai paste --json
```

### 查询常用命令

```bash
devai cmd docker
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
4. 查看最近分析历史
5. 配置后端地址 / 模型
6. 知识文档整理
7. 退出

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
    "content": "报错日志内容",
    "source": "cli-paste"
  }'
```

CLI 文件分析兼容接口：

```bash
curl -X POST http://localhost:8088/api/analyze/file \
  -H "Content-Type: application/json" \
  -d '{
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
    "keyword": "docker logs"
  }'
```

TUI 最近历史：

```bash
curl "http://localhost:8088/api/history/recent?limit=20"
```

知识文档整理占位：

```bash
curl -X POST http://localhost:8088/api/knowledge/generate \
  -H "Content-Type: application/json" \
  -d '{"source":"tui-manual"}'
```

历史记录：

```bash
curl http://localhost:8088/api/diagnosis/history
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
- CLI 来源调用会额外写入 `devai_analysis_history`，为后续知识库整理能力预留。
- TUI 配置文件不存在时会自动创建 `~/.devai/config.json`。

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
