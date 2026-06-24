import ora from 'ora';
import type { Command } from 'commander';
import { searchCommand } from '../core/api.js';
import { handleCliError } from '../core/errorHandler.js';
import { printCommandResult } from '../core/output.js';
import { resolveProject, resolveScene } from '../core/projectSelector.js';

interface CmdOptions {
  json?: boolean;
  project?: string;
  scene?: string;
}

export function registerCmdCommand(program: Command): void {
  program
    .command('cmd')
    .description('查询常用开发命令')
    .argument('<keywords...>', '命令关键词，例如 docker logs')
    .option('--project <name>', '项目名称，不存在时可确认创建')
    .option('--scene <name>', '场景名称，不存在时可确认创建')
    .option('--json', '直接输出后端 JSON')
    .action(async (keywords: string[], options: CmdOptions) => {
      try {
        const keyword = keywords.join(' ').trim();
        if (!keyword) {
          throw new Error('请输入要查询的命令关键词。');
        }

        const project = await resolveProject(options.project);
        const scene = await resolveScene(project.id, options.scene);
        const spinner = options.json ? null : ora('DevAI 正在查询命令...').start();
        const result = await searchCommand(keyword, 'cli-cmd', undefined, project.id, scene.id);
        spinner?.stop();

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }
        printCommandResult(result);
      } catch (error) {
        handleCliError(error);
      }
    });
}
