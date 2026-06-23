import ora from 'ora';
import type { Command } from 'commander';
import { analyzeFileContent } from '../core/api.js';
import { handleCliError } from '../core/errorHandler.js';
import { parseLogFile } from '../core/fileParser.js';
import { printAnalyzeResult } from '../core/output.js';

interface AnalyzeOptions {
  file?: string;
  json?: boolean;
}

export function registerAnalyzeCommand(program: Command): void {
  program
    .command('analyze')
    .description('分析本地日志文件')
    .requiredOption('--file <path>', '日志文件路径，支持 .log、.txt、.out')
    .option('--json', '直接输出后端 JSON')
    .action(async (options: AnalyzeOptions) => {
      try {
        if (!options.file) {
          throw new Error('请通过 --file 指定日志文件路径。');
        }

        const parsed = await parseLogFile(options.file);
        const spinner = options.json ? null : ora('DevAI 正在分析日志文件...').start();
        const result = await analyzeFileContent(parsed.fileName, parsed.content);
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
