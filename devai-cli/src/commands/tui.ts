import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { createInterface } from 'node:readline/promises';
import chalk from 'chalk';
import type { Command } from 'commander';
import {
  analyzeFileContent,
  analyzePastedLog,
  createBugIssue,
  createProject,
  createScene,
  deleteHistory,
  exportSummaryDoc,
  fetchBugIssues,
  fetchCommandHistory,
  fetchLogHistory,
  fetchHistoryDetail,
  fetchProjects,
  fetchScenes,
  fetchSummaryDocs,
  fetchRecentHistory,
  generateCommandSummary,
  generateLogSummary,
  importSummaryDoc,
  getApiBaseUrl,
  saveBugRecord,
  searchCommand,
  searchBugArchive,
  setApiBaseUrl,
  summarizeBugRecord,
  toUserFriendlyApiError,
} from '../core/api.js';
import { ensureConfigFile, getConfigPath, getTuiLogPath, saveConfig, type DevaiConfig } from '../core/config.js';
import { parseLogFile } from '../core/fileParser.js';
import type { AnalyzeResponse } from '../types/analyze.js';
import type { CommandSearchResponse } from '../types/command.js';
import type { CommandHistoryItem, HistoryDetailResponse, HistorySummary, LogHistoryItem } from '../types/history.js';
import type { Project, Scene } from '../types/project.js';

interface TuiOptions {
  api?: string;
  debug?: boolean;
  jsonLog?: boolean;
}

type MenuResult = number | 'quit' | 'back';

const footer = '↑/↓ 选择  Enter 确认  Esc 返回  q 退出  Ctrl+C 强制退出';

export function registerTuiCommand(program: Command): void {
  program
    .command('tui')
    .description('进入 DevAI 终端交互界面')
    .option('--api <url>', '覆盖默认后端地址')
    .option('--debug', '显示调试信息')
    .option('--json-log', '将 TUI 操作日志保存为 JSON')
    .action(async (options: TuiOptions) => {
      const app = new TuiApp(options);
      await app.run();
    });
}

class TuiApp {
  private config: DevaiConfig;
  private lastAnalyzeResult?: AnalyzeResponse;
  private lastCommandResult?: CommandSearchResponse;

  constructor(private readonly options: TuiOptions) {
    this.config = ensureConfigFile();
    if (options.api) {
      this.config.apiBaseUrl = normalizeBaseUrl(options.api);
    }
    if (options.debug) {
      this.config.debug = true;
    }
    setApiBaseUrl(this.config.apiBaseUrl);
  }

  async run(): Promise<void> {
    process.on('SIGINT', () => {
      this.log('exit', 'ctrl-c');
      console.log('\n已退出 DevAI TUI');
      process.exit(0);
    });

    while (true) {
      const choice = await this.selectMenu('DevAI 报错分析助手', [
        '粘贴报错日志分析',
        '查询常用开发命令',
        '分析本地日志文件',
        '查看历史记录',
        '总结文档',
        'Bug 排查记录',
        '配置后端地址 / 模型',
        '退出',
      ]);

      if (choice === 'quit' || choice === 7) {
        this.log('exit', 'main');
        this.clear();
        console.log('已退出 DevAI TUI');
        return;
      }
      if (choice === 0) {
        await this.pastePage();
      } else if (choice === 1) {
        await this.commandPage();
      } else if (choice === 2) {
        await this.filePage();
      } else if (choice === 3) {
        await this.historyPage();
      } else if (choice === 4) {
        await this.summaryPage();
      } else if (choice === 5) {
        await this.bugPage();
      } else if (choice === 6) {
        await this.configPage();
      }
    }
  }

  private async pastePage(): Promise<void> {
    while (true) {
      const project = await this.chooseProject();
      if (!project) {
        return;
      }
      const scene = await this.chooseScene(project);
      if (!scene) {
        return;
      }
      this.clear();
      this.header('粘贴报错日志分析');
      console.log('请粘贴日志，输入一行 ---END--- 提交。输入 b 返回，q 退出。');
      const content = await this.readMultiline('---END---');
      const normalized = content.trim();
      if (normalized === 'b') {
        return;
      }
      if (normalized === 'q') {
        process.exit(0);
      }
      if (!normalized) {
        await this.pause('没有输入任何日志内容。');
        continue;
      }

      try {
        this.loading('正在分析，请稍候...');
        const result = await analyzePastedLog(content, 'tui-paste', this.config.defaultModel, project.id, scene.id);
        this.lastAnalyzeResult = result;
        this.log('paste-analyze', 'success');
        await this.showAnalyzeResult(result, '分析完成', async (action) => {
          if (action === 'r') {
            return 'repeat';
          }
          if (action === 'c') {
            await this.pause(this.commandsText(result) || '没有可复制的推荐命令，请手动查看结果。');
            return 'stay';
          }
          if (action === 's') {
            await this.pause('后端已自动保存本次结果。');
            return 'stay';
          }
          return 'back';
        });
      } catch (error) {
        await this.showError(error);
      }
    }
  }

  private async commandPage(): Promise<void> {
    while (true) {
      const project = await this.chooseProject();
      if (!project) {
        return;
      }
      const scene = await this.chooseScene(project);
      if (!scene) {
        return;
      }
      this.clear();
      this.header('查询常用开发命令');
      console.log('示例：docker、mysql、linux log、nginx、git rollback、java process');
      const keyword = (await this.ask('请输入关键词，b 返回，q 退出：')).trim();
      if (keyword === 'b') {
        return;
      }
      if (keyword === 'q') {
        process.exit(0);
      }
      if (!keyword) {
        await this.pause('关键词不能为空。');
        continue;
      }

      try {
        this.loading('正在查询，请稍候...');
        const result = await searchCommand(keyword, 'tui-cmd', this.config.defaultModel, project.id, scene.id);
        this.lastCommandResult = result;
        this.log('cmd-search', 'success', { keyword });
        this.clear();
        this.header('命令查询结果');
        this.printCommandResult(result);
        const next = await this.ask('输入新关键词继续查询，直接 Enter 返回，q 退出：');
        if (next.trim() === 'q') {
          process.exit(0);
        }
        if (next.trim()) {
          await this.runCommandKeyword(next.trim(), project, scene);
        } else {
          return;
        }
      } catch (error) {
        await this.showError(error);
      }
    }
  }

  private async runCommandKeyword(keyword: string, project: Project, scene: Scene): Promise<void> {
    try {
      this.loading('正在查询，请稍候...');
      const result = await searchCommand(keyword, 'tui-cmd', this.config.defaultModel, project.id, scene.id);
      this.lastCommandResult = result;
      this.clear();
      this.header('命令查询结果');
      this.printCommandResult(result);
      await this.pause();
    } catch (error) {
      await this.showError(error);
    }
  }

  private async filePage(): Promise<void> {
    let currentPath = '';
    while (true) {
      const project = await this.chooseProject();
      if (!project) {
        return;
      }
      const scene = await this.chooseScene(project);
      if (!scene) {
        return;
      }
      if (!currentPath) {
        this.clear();
        this.header('分析本地日志文件');
        currentPath = (await this.ask('请输入日志文件路径，b 返回，q 退出：')).trim();
      }
      if (currentPath === 'b') {
        return;
      }
      if (currentPath === 'q') {
        process.exit(0);
      }

      try {
        const parsed = await parseLogFile(currentPath);
        this.loading('正在分析，请稍候...');
        const result = await analyzeFileContent(parsed.fileName, parsed.content, 'tui-file', this.config.defaultModel, project.id, scene.id);
        this.lastAnalyzeResult = result;
        this.log('file-analyze', 'success', { fileName: parsed.fileName });
        const action = await this.showAnalyzeResult(result, '分析完成', async (value) => {
          if (value === 'r') {
            return 'repeat';
          }
          if (value === 'o') {
            currentPath = '';
            return 'back';
          }
          return 'back';
        });
        if (action === 'repeat') {
          continue;
        }
        if (!currentPath) {
          continue;
        }
        return;
      } catch (error) {
        await this.showError(error);
        currentPath = '';
      }
    }
  }

  private async historyPage(): Promise<void> {
    while (true) {
      try {
        const project = await this.chooseProject();
        if (!project) {
          return;
        }
        const scene = await this.chooseScene(project);
        if (!scene) {
          return;
        }
        const kind = await this.selectMenu('查看历史记录', ['日志分析历史', '命令查询历史', '返回主菜单']);
        if (kind === 'quit') {
          process.exit(0);
        }
        if (kind === 'back' || kind === 2) {
          return;
        }
        this.loading('正在读取历史记录...');
        if (kind === 0) {
          const list = await fetchLogHistory(project.id, scene.id);
          if (list.length === 0) {
            await this.pause('暂无日志分析历史。');
            return;
          }
          await this.showLogHistoryList(list);
          return;
        }
        const list = await fetchCommandHistory(project.id, scene.id);
        if (list.length === 0) {
          await this.pause('暂无命令查询历史。');
          return;
        }
        await this.showCommandHistoryList(list);
        return;
      } catch (error) {
        await this.showError(error);
        return;
      }
    }
  }

  private async showLogHistoryList(list: LogHistoryItem[]): Promise<void> {
    const selected = await this.selectMenu('日志分析历史', list.map((item) => `[${item.source || '-'}] ${item.summary || item.question || '无摘要'} | 类型：${item.errorType || '-'} | 时间：${item.createdAt || '-'}`));
    if (selected === 'quit') {
      process.exit(0);
    }
    if (selected === 'back') {
      return;
    }
    const item = list[selected];
    await this.pause(`历史记录 #${item.id}\n${item.summary || item.question || ''}`);
  }

  private async showCommandHistoryList(list: CommandHistoryItem[]): Promise<void> {
    const selected = await this.selectMenu('命令查询历史', list.map((item) => `[场景 #${item.sceneId || '-'}] ${item.question || item.keyword || '无问题'} | 时间：${item.createdAt || '-'}`));
    if (selected === 'quit') {
      process.exit(0);
    }
    if (selected === 'back') {
      return;
    }
    const item = list[selected];
    await this.pause(`历史记录 #${item.id}\n${item.question || item.keyword || ''}`);
  }

  private async historyDetailPage(id: number): Promise<void> {
    try {
      const detail = await fetchHistoryDetail(id);
      while (true) {
        this.clear();
        this.header(`历史记录 #${detail.id}`);
        this.printHistoryDetail(detail);
        const action = (await this.ask('d 删除，b 返回，q 退出：')).trim();
        if (action === 'q') {
          process.exit(0);
        }
        if (action === 'b' || action === '') {
          return;
        }
        if (action === 'd') {
          await deleteHistory(id);
          await this.pause('已删除历史记录。');
          return;
        }
      }
    } catch (error) {
      await this.showError(error);
    }
  }

  private async configPage(): Promise<void> {
    while (true) {
      const selected = await this.selectMenu('配置后端地址 / 模型', [
        `后端地址：${this.config.apiBaseUrl}`,
        `默认模型：${this.config.defaultModel || '未设置'}`,
        `Debug：${this.config.debug ? '开启' : '关闭'}`,
        `自动保存历史：${this.config.autoSaveHistory ? '开启' : '关闭'}`,
        `配置文件：${getConfigPath()}`,
        '返回主菜单',
      ]);
      if (selected === 'quit') {
        process.exit(0);
      }
      if (selected === 'back' || selected === 5) {
        return;
      }
      if (selected === 0) {
        const value = (await this.ask('请输入新的后端地址：')).trim();
        if (value) {
          this.config.apiBaseUrl = normalizeBaseUrl(value);
          setApiBaseUrl(this.config.apiBaseUrl);
          saveConfig(this.config);
          await this.pause('后端地址已保存。');
        }
      } else if (selected === 1) {
        const value = (await this.ask('请输入默认模型名称：')).trim();
        if (value) {
          this.config.defaultModel = value;
          saveConfig(this.config);
          await this.pause('默认模型已保存。模型切换入口已预留，实际调用仍由后端统一处理。');
        }
      } else if (selected === 2) {
        this.config.debug = !this.config.debug;
        saveConfig(this.config);
      } else if (selected === 3) {
        this.config.autoSaveHistory = !this.config.autoSaveHistory;
        saveConfig(this.config);
      } else if (selected === 4) {
        await this.pause(getConfigPath());
      }
    }
  }

  private async summaryPage(): Promise<void> {
    while (true) {
      const selected = await this.selectMenu('总结文档', [
        '手动生成命令总结',
        '手动生成日志问题报告',
        '导出总结文档',
        '导入总结文档',
        '查看历史总结',
        '返回',
      ]);
      if (selected === 'quit') {
        process.exit(0);
      }
      if (selected === 'back' || selected === 5) {
        return;
      }
      const project = await this.chooseProject();
      if (!project) {
        return;
      }
      const scene = await this.chooseScene(project);
      if (!scene) {
        return;
      }
      try {
        if (selected === 0) {
          this.loading('正在生成命令总结...');
          const doc = await generateCommandSummary(project.id, scene.id);
          await this.pause(`${doc.title || '命令总结'}\n\n${doc.content || ''}`);
        } else if (selected === 1) {
          this.loading('正在生成日志问题报告...');
          const doc = await generateLogSummary(project.id, scene.id);
          await this.pause(`${doc.title || '日志问题报告'}\n\n${doc.content || ''}`);
        } else if (selected === 2) {
          const docs = await fetchSummaryDocs(project.id, scene.id);
          if (!docs.length) {
            await this.pause('暂无可导出的总结文档。');
            continue;
          }
          const docIndex = await this.selectMenu('选择导出文档', docs.map((doc) => `#${doc.id} ${doc.title || '未命名'}`));
          if (docIndex === 'quit') {
            process.exit(0);
          }
          if (docIndex === 'back') {
            continue;
          }
          const outputPath = (await this.ask('请输入导出路径：')).trim();
          if (!outputPath) {
            await this.pause('导出路径不能为空。');
            continue;
          }
          const buffer = await exportSummaryDoc(docs[docIndex].id);
          fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
          fs.writeFileSync(outputPath, buffer);
          await this.pause(`已导出：${outputPath}`);
        } else if (selected === 3) {
          const filePath = (await this.ask('请输入导入文件路径：')).trim();
          if (!filePath) {
            await this.pause('导入文件路径不能为空。');
            continue;
          }
          const fileContent = fs.readFileSync(filePath);
          const parsed = JSON.parse(fileContent.toString('utf8')) as {
            summary?: { summaryType?: string; environment?: string };
            items?: Array<{ summary?: { summaryType?: string; environment?: string } }>;
          };
          const firstSummary = parsed.summary || parsed.items?.[0]?.summary;
          const summaryType = firstSummary?.summaryType === 'log_problem' ? 'log_problem' : 'command';
          const result = await importSummaryDoc({
            fileName: path.basename(filePath),
            fileContent,
            projectId: project.id,
            sceneId: scene.id,
            summaryType,
          });
          await this.pause(`导入完成：${result.id ? `#${result.id}` : `${result.successCount || 0} 条成功`}`);
        } else if (selected === 4) {
          await this.pause('请在 Web 后台的“总结文档”页面查看历史总结列表。');
        }
      } catch (error) {
        await this.showError(error);
      }
    }
  }

  private async bugPage(): Promise<void> {
    while (true) {
      const selected = await this.selectMenu('Bug 排查记录', [
        '新建 Bug 问题',
        '记录排查过程',
        '查看 Bug 档案',
        '搜索 Bug 档案',
        '返回',
      ]);
      if (selected === 'quit') {
        process.exit(0);
      }
      if (selected === 'back' || selected === 4) {
        return;
      }
      const project = await this.chooseProject();
      if (!project) {
        return;
      }
      const scene = await this.chooseScene(project);
      if (!scene) {
        return;
      }
      try {
        if (selected === 0) {
          const name = (await this.ask('请输入问题名称：')).trim();
          if (!name) {
            await this.pause('问题名称不能为空。');
            continue;
          }
          const errorType = (await this.ask('错误类型（可选）：')).trim();
          const tags = (await this.ask('标签（逗号分隔，可选）：')).trim();
          const issue = await createBugIssue({
            projectId: project.id,
            sceneId: scene.id,
            issueName: name,
            status: 'open',
            errorType: errorType || undefined,
            tags: this.parseTags(tags),
          });
          await this.pause(`已创建 Bug 问题：#${issue.id} ${name}`);
        } else if (selected === 1) {
          const issue = await this.chooseBugIssue(project, scene);
          if (!issue) {
            continue;
          }
          this.clear();
          this.header('记录排查过程');
          console.log('请输入排查过程，单独一行 ---END--- 结束。');
          const rawContent = (await this.readMultiline('---END---')).trim();
          if (!rawContent) {
            await this.pause('排查过程不能为空。');
            continue;
          }
          this.loading('正在调用后端 AI 整理...');
          const summary = await summarizeBugRecord({
            projectId: project.id,
            issueId: issue.id,
            rawContent,
            source: 'tui',
          });
          this.clear();
          this.header('AI 整理结果');
          console.log(summary.aiSummary);
          const confirm = (await this.ask('确认保存归档？(Y/n)：')).trim().toLowerCase();
          if (confirm === 'n') {
            await this.pause('已取消保存。');
            continue;
          }
          const record = await saveBugRecord({
            projectId: project.id,
            issueId: issue.id,
            rawContent,
            aiSummary: summary.aiSummary,
            finalContent: summary.aiSummary,
            source: 'tui',
            status: 'resolved',
            errorType: summary.suggestedErrorType || issue.errorType,
            tags: summary.suggestedTags || issue.tags,
          });
          await this.pause(`已保存排查记录：#${record.id}`);
        } else if (selected === 2) {
          const issues = await fetchBugIssues(project.id, scene.id);
          if (!issues.list.length) {
            await this.pause('暂无 Bug 档案。');
            continue;
          }
          await this.pause(
            issues.list
              .map((issue) => `#${issue.id} ${issue.issueName} | ${issue.status || '-'} | ${issue.errorType || '-'}`)
              .join('\n'),
          );
        } else if (selected === 3) {
          const keyword = (await this.ask('请输入搜索关键词：')).trim();
          if (!keyword) {
            await this.pause('关键词不能为空。');
            continue;
          }
          const result = await searchBugArchive(keyword, project.id, scene.id);
          if (!result.list.length) {
            await this.pause('暂无匹配的 Bug 档案。');
            continue;
          }
          await this.pause(
            result.list
              .map((item) => `${item.projectName} / ${item.sceneName || `场景 #${item.sceneId}`} / ${item.issueName}\n命中：${item.hitContent || '-'}\n时间：${item.recordTime || '-'}`)
              .join('\n\n'),
          );
        }
      } catch (error) {
        await this.showError(error);
      }
    }
  }

  private async chooseBugIssue(project: Project, scene: Scene): Promise<import('../types/bug.js').BugIssue | null> {
    const issues = await fetchBugIssues(project.id, scene.id);
    const items = [...issues.list.map((issue) => issue.issueName), '新建 Bug 问题', '返回'];
    const selected = await this.selectMenu('选择 Bug 问题', items);
    if (selected === 'quit') {
      process.exit(0);
    }
    if (selected === 'back' || selected === items.length - 1) {
      return null;
    }
    if (selected === items.length - 2) {
      const name = (await this.ask('请输入问题名称：')).trim();
      if (!name) {
        await this.pause('问题名称不能为空。');
        return null;
      }
      const issue = await createBugIssue({ projectId: project.id, sceneId: scene.id, issueName: name, status: 'open' });
      return { id: issue.id, projectId: project.id, sceneId: scene.id, issueName: name, status: 'open', tags: [] };
    }
    return issues.list[selected] || null;
  }

  private async showAnalyzeResult(
    result: AnalyzeResponse,
    message: string,
    handleAction: (action: string) => Promise<'repeat' | 'stay' | 'back'>,
  ): Promise<'repeat' | 'back'> {
    while (true) {
      this.clear();
      this.header(message);
      this.printAnalyzeResult(result);
      const action = (await this.ask('r 重新分析，c 查看推荐命令，s 保存状态，o 重选文件，b 返回，q 退出：')).trim();
      if (action === 'q') {
        process.exit(0);
      }
      if (action === 'b' || action === '') {
        return 'back';
      }
      const handled = await handleAction(action);
      if (handled === 'repeat') {
        return 'repeat';
      }
      if (handled === 'back') {
        return 'back';
      }
    }
  }

  private async chooseProject(): Promise<Project | null> {
    try {
      const projects = await fetchProjects();
      const items = [...projects.map((project) => project.name), '新建项目', '返回'];
      const selected = await this.selectMenu('选择项目', items);
      if (selected === 'quit') {
        process.exit(0);
      }
      if (selected === 'back' || selected === items.length - 1) {
        return null;
      }
      if (selected === items.length - 2) {
        const name = (await this.ask('请输入新项目名：')).trim();
        if (!name) {
          await this.pause('项目名不能为空。');
          return null;
        }
        return await createProject(name);
      }
      return projects[selected] || null;
    } catch (error) {
      await this.showError(error);
      return null;
    }
  }

  private async chooseScene(project: Project): Promise<Scene | null> {
    try {
      const scenes = await fetchScenes(project.id);
      const items = [...scenes.map((scene) => scene.name), '新建场景', '返回'];
      const selected = await this.selectMenu('选择场景', items);
      if (selected === 'quit') {
        process.exit(0);
      }
      if (selected === 'back' || selected === items.length - 1) {
        return null;
      }
      if (selected === items.length - 2) {
        const name = (await this.ask('请输入新场景名：')).trim();
        if (!name) {
          await this.pause('场景名不能为空。');
          return null;
        }
        return await createScene(project.id, name);
      }
      return scenes[selected] || null;
    } catch (error) {
      await this.showError(error);
      return null;
    }
  }

  private async selectMenu(title: string, items: string[]): Promise<MenuResult> {
    if (!process.stdin.isTTY) {
      this.clear();
      this.header(title);
      items.forEach((item, index) => console.log(`${index + 1}. ${item}`));
      const answer = await this.ask('请选择序号，q 退出：');
      if (answer.trim() === 'q') {
        return 'quit';
      }
      const selected = Number.parseInt(answer, 10) - 1;
      return Number.isInteger(selected) && selected >= 0 && selected < items.length ? selected : 'back';
    }

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    let selected = 0;

    return new Promise((resolve) => {
      const render = () => {
        this.clear();
        this.header(title);
        items.forEach((item, index) => {
          const prefix = index === selected ? chalk.cyan('>') : ' ';
          const text = index === selected ? chalk.cyan.bold(item) : item;
          console.log(`${prefix} ${text}`);
        });
        console.log('');
        console.log(chalk.gray(footer));
        if (this.config.debug || this.options.debug) {
          console.log(chalk.gray(`API: ${getApiBaseUrl()}`));
        }
      };

      const cleanup = () => {
        process.stdin.off('keypress', onKey);
        process.stdin.setRawMode(false);
      };

      const onKey = (_chunk: string, key: readline.Key) => {
        if (key.name === 'up') {
          selected = (selected - 1 + items.length) % items.length;
          render();
        } else if (key.name === 'down') {
          selected = (selected + 1) % items.length;
          render();
        } else if (key.name === 'return') {
          cleanup();
          resolve(selected);
        } else if (key.name === 'escape') {
          cleanup();
          resolve('back');
        } else if (key.name === 'q') {
          cleanup();
          resolve('quit');
        } else if (key.ctrl && key.name === 'c') {
          cleanup();
          resolve('quit');
        }
      };

      process.stdin.on('keypress', onKey);
      render();
    });
  }

  private async readMultiline(endMarker: string): Promise<string> {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const lines: string[] = [];
    while (true) {
      const line = await rl.question('');
      if (line.trim() === endMarker) {
        rl.close();
        return lines.join('\n');
      }
      lines.push(line);
    }
  }

  private async ask(question: string): Promise<string> {
    if (process.stdin.isTTY && process.stdin.isRaw) {
      process.stdin.setRawMode(false);
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(question);
    rl.close();
    return answer;
  }

  private async pause(message = '按 Enter 返回。'): Promise<void> {
    if (message) {
      console.log('');
      console.log(message);
    }
    await this.ask('按 Enter 继续...');
  }

  private async showError(error: unknown): Promise<void> {
    const friendly = toUserFriendlyApiError(error);
    this.log('error', 'failed', { message: friendly.message });
    this.clear();
    this.header('操作失败');
    console.log(chalk.red(friendly.message));
    console.log('');
    console.log('当前后端地址：');
    console.log(getApiBaseUrl());
    console.log('');
    console.log('请确认后端已启动：');
    console.log('cd backend');
    console.log('mvn spring-boot:run');
    console.log('');
    console.log(`或者检查配置文件：${getConfigPath()}`);
    await this.pause();
  }

  private printAnalyzeResult(result: AnalyzeResponse): void {
    this.section('报错类型', result.errorType);
    this.section('核心原因', result.cause);
    this.list('关键错误行', result.keyLines);
    this.section('影响范围', result.impact);
    this.list('解决方案', result.solution);
    const commands = result.commands || [];
    if (commands.length > 0) {
      console.log(chalk.yellow('【推荐命令】'));
      commands.forEach((command) => console.log(chalk.green(`$ ${command}`)));
      console.log('');
    }
    this.list('相关知识点', result.knowledge);
  }

  private printCommandResult(result: CommandSearchResponse): void {
    this.section('分类', result.category);
    this.section('使用场景', result.scenario);
    const commands = result.commands || [];
    if (commands.length > 0) {
      console.log(chalk.yellow('【常用命令】'));
      commands.forEach((item, index) => {
        console.log(`${index + 1}. ${item.command || ''}`);
        if (item.description) {
          console.log(`   说明：${item.description}`);
        }
        if (item.example) {
          console.log(`   示例：${item.example}`);
        }
      });
      console.log('');
    }
    this.list('注意事项', result.tips);
  }

  private printHistoryDetail(detail: HistoryDetailResponse): void {
    this.section('来源', detail.source);
    this.section('摘要', detail.summary);
    this.section('类型', detail.errorType);
    this.section('时间', detail.createdAt);
    this.section('模型', detail.modelName);
    this.section('原始问题', detail.question);
    if (detail.resultJson) {
      console.log(chalk.yellow('【结果 JSON】'));
      console.log(detail.resultJson);
      console.log('');
    }
  }

  private formatHistoryLine(item: HistorySummary): string {
    return `[${item.source || '-'}] ${item.summary || '无摘要'} | 类型：${item.errorType || '-'} | 时间：${item.createdAt || '-'}`;
  }

  private commandsText(result: AnalyzeResponse): string {
    return (result.commands || []).map((command) => `$ ${command}`).join('\n');
  }

  private parseTags(value?: string): string[] {
    return (value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private section(title: string, value?: string): void {
    if (!value || !value.trim()) {
      return;
    }
    console.log(chalk.yellow(`【${title}】`));
    console.log(value);
    console.log('');
  }

  private list(title: string, values?: string[]): void {
    const list = (values || []).filter(Boolean);
    if (list.length === 0) {
      return;
    }
    console.log(chalk.yellow(`【${title}】`));
    list.forEach((value, index) => console.log(`${index + 1}. ${value}`));
    console.log('');
  }

  private header(title: string): void {
    console.log(chalk.cyan.bold(title));
    console.log('');
  }

  private loading(message: string): void {
    this.clear();
    this.header('DevAI 报错分析助手');
    console.log(message);
  }

  private clear(): void {
    process.stdout.write('\x1Bc');
  }

  private log(action: string, status: string, detail?: unknown): void {
    if (!this.options.jsonLog) {
      return;
    }
    const logPath = getTuiLogPath();
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(
      logPath,
      `${JSON.stringify({ time: new Date().toISOString(), action, status, detail })}\n`,
      'utf8',
    );
  }
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
