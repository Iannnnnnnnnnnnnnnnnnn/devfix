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

默认配置：

- 后端端口：`8088`
- 前端端口：`5173`
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
http://localhost:5173
```

如需指定后端地址：

```bash
VITE_API_BASE_URL=http://localhost:8088 npm run dev
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

命令助手：

```bash
curl -X POST http://localhost:8088/api/command/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "question": "查看 nginx 最近 200 行错误日志",
    "environment": "linux"
  }'
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
