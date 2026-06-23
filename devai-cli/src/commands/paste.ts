import readline from 'node:readline';
import ora from 'ora';
import type { Command } from 'commander';
import { analyzePastedLog } from '../core/api.js';
import { handleCliError } from '../core/errorHandler.js';
import { printAnalyzeResult, printSuccess } from '../core/output.js';

interface PasteOptions {
  json?: boolean;
}

export function registerPasteCommand(program: Command): void {
  program
    .command('paste')
    .description('粘贴报错日志并分析')
    .option('--json', '直接输出后端 JSON')
    .action(async (options: PasteOptions) => {
      try {
        const content = await readPastedLog();
        if (!content.trim()) {
          throw new Error('没有输入任何日志内容。');
        }

        const spinner = options.json ? null : ora('DevAI 正在分析日志...').start();
        const result = await analyzePastedLog(content);
        spinner?.stop();

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }
        printAnalyzeResult(result);
      } catch (error) {
        handleCliError(error);
      }
    });
}

function readPastedLog(): Promise<string> {
  printSuccess('请粘贴报错日志，输入 EOF 或 ---END--- 结束：');
  const lines: string[] = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  return new Promise((resolve) => {
    rl.on('line', (line) => {
      if (line.trim() === 'EOF' || line.trim() === '---END---') {
        rl.close();
        return;
      }
      lines.push(line);
    });
    rl.on('close', () => resolve(lines.join('\n')));
  });
}
