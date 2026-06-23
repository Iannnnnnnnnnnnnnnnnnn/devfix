import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { createInterface } from 'node:readline/promises';
import chalk from 'chalk';
import type { Command } from 'commander';
import {
  analyzeFileContent,
  analyzePastedLog,
  deleteHistory,
  fetchHistoryDetail,
  fetchRecentHistory,
  generateKnowledge,
  getApiBaseUrl,
  searchCommand,
  setApiBaseUrl,
  toUserFriendlyApiError,
} from '../core/api.js';
import { ensureConfigFile, getConfigPath, getTuiLogPath, saveConfig, type DevaiConfig } from '../core/config.js';
import { parseLogFile } from '../core/fileParser.js';
import type { AnalyzeResponse } from '../types/analyze.js';
import type { CommandSearchResponse } from '../types/command.js';
import type { HistoryDetailResponse, HistorySummary } from '../types/history.js';

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
        '查看最近分析历史',
        '配置后端地址 / 模型',
        '知识文档整理',
        '退出',
      ]);

      if (choice === 'quit' || choice === 6) {
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
        await this.configPage();
      } else if (choice === 5) {
        await this.knowledgePage();
      }
    }
  }

  private async pastePage(): Promise<void> {
    while (true) {
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
        const result = await analyzePastedLog(content, 'tui-paste', this.config.defaultModel);
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
        const result = await searchCommand(keyword, 'tui-cmd', this.config.defaultModel);
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
          await this.runCommandKeyword(next.trim());
        } else {
          return;
        }
      } catch (error) {
        await this.showError(error);
      }
    }
  }

  private async runCommandKeyword(keyword: string): Promise<void> {
    try {
      this.loading('正在查询，请稍候...');
      const result = await searchCommand(keyword, 'tui-cmd', this.config.defaultModel);
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
        const result = await analyzeFileContent(parsed.fileName, parsed.content, 'tui-file', this.config.defaultModel);
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
        this.loading('正在读取历史记录...');
        const history = await fetchRecentHistory(20);
        const list = history.list || [];
        if (list.length === 0) {
          await this.pause('暂无分析历史。');
          return;
        }
        const selected = await this.selectMenu('最近分析历史', list.map((item) => this.formatHistoryLine(item)));
        if (selected === 'quit') {
          process.exit(0);
        }
        if (selected === 'back') {
          return;
        }
        await this.historyDetailPage(list[selected].id);
      } catch (error) {
        await this.showError(error);
        return;
      }
    }
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

  private async knowledgePage(): Promise<void> {
    this.clear();
    this.header('知识文档整理');
    console.log('该功能用于把历史报错分析、常见命令、解决方案整理成知识文档。');
    console.log('后续将支持定时整理、手动整理、按错误类型归档、搜索历史问题和文档检索。');
    try {
      const result = await generateKnowledge('tui-manual');
      await this.pause(result.message || '知识文档整理功能已预留，后续版本将支持自动整理和文档检索。');
    } catch (error) {
      await this.showError(error);
    }
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
