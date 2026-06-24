import fs from 'node:fs/promises';
import path from 'node:path';
import type { Command } from 'commander';
import { exportSummaryDoc, importSummaryDoc } from '../core/api.js';
import { handleCliError } from '../core/errorHandler.js';
import { resolveProject, resolveScene } from '../core/projectSelector.js';

interface SummaryExportOptions {
  id?: string;
  output?: string;
}

interface SummaryImportOptions {
  file?: string;
  project?: string;
  scene?: string;
  type?: string;
  title?: string;
  tags?: string;
  allowDuplicate?: boolean;
}

export function registerSummaryCommand(program: Command): void {
  const command = program.command('summary').description('导入导出总结文档');

  command
    .command('export')
    .description('导出总结文档')
    .requiredOption('--id <id>', '总结文档 id')
    .requiredOption('--output <path>', '导出文件路径')
    .action(async (options: SummaryExportOptions) => {
      try {
        const id = Number.parseInt(options.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
          throw new Error('--id 必须是有效数字。');
        }
        if (!options.output) {
          throw new Error('请通过 --output 指定导出路径。');
        }
        const data = await exportSummaryDoc(id);
        await fs.mkdir(path.dirname(path.resolve(options.output)), { recursive: true });
        await fs.writeFile(options.output, data);
        console.log(`已导出：${options.output}`);
      } catch (error) {
        handleCliError(error);
      }
    });

  command
    .command('import')
    .description('导入总结文档')
    .requiredOption('--file <path>', '导入文件路径')
    .option('--project <name>', '导入到指定项目')
    .option('--scene <name>', '导入到指定场景')
    .option('--type <type>', '总结类型：command 或 log_problem')
    .option('--title <title>', '自定义标题')
    .option('--tags <tags>', '逗号分隔标签')
    .option('--allow-duplicate', '允许导入可能重复的文档')
    .action(async (options: SummaryImportOptions) => {
      try {
        if (!options.file) {
          throw new Error('请通过 --file 指定导入文件。');
        }
        const filePath = path.resolve(options.file);
        const fileContent = await fs.readFile(filePath);
        const parsed = JSON.parse(fileContent.toString('utf8')) as {
          summary?: { summaryType?: string; environment?: string; title?: string };
          items?: Array<{ summary?: { summaryType?: string; environment?: string; title?: string } }>;
        };
        const firstSummary = parsed.summary || parsed.items?.[0]?.summary;
        const project = await resolveProject(options.project);
        const scene = await resolveScene(project.id, options.scene);
        const summaryType = options.type || firstSummary?.summaryType;
        if (summaryType !== 'command' && summaryType !== 'log_problem') {
          throw new Error('--type 必须是 command 或 log_problem。');
        }
        const result = await importSummaryDoc({
          fileName: path.basename(filePath),
          fileContent,
          projectId: project.id,
          sceneId: scene.id,
          summaryType,
          title: options.title,
          tags: options.tags,
          allowDuplicate: options.allowDuplicate,
        });
        console.log(`导入完成：${result.id ? `#${result.id} ${result.title || ''}` : `${result.successCount || 0} 条成功`}`);
      } catch (error) {
        handleCliError(error);
      }
    });
}
