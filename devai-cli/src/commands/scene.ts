import type { Command } from 'commander';
import { createScene, fetchScenes } from '../core/api.js';
import { handleCliError } from '../core/errorHandler.js';
import { resolveProject } from '../core/projectSelector.js';

export function registerSceneCommand(program: Command): void {
  const command = program.command('scene').description('管理 DevAI 场景');

  command
    .command('list')
    .description('查看项目下的场景')
    .requiredOption('--project <name>', '项目名称')
    .action(async (options: { project: string }) => {
      try {
        const project = await resolveProject(options.project);
        const scenes = await fetchScenes(project.id);
        scenes.forEach((scene) => console.log(`${scene.id}\t${scene.name}\t${scene.description || ''}`));
      } catch (error) {
        handleCliError(error);
      }
    });

  command
    .command('create')
    .description('创建场景')
    .requiredOption('--project <name>', '项目名称')
    .requiredOption('--name <name>', '场景名称')
    .option('--description <text>', '场景说明')
    .action(async (options: { project: string; name: string; description?: string }) => {
      try {
        const project = await resolveProject(options.project);
        const scene = await createScene(project.id, options.name, options.description || '');
        console.log(`已创建场景：${scene.id} ${scene.name}`);
      } catch (error) {
        handleCliError(error);
      }
    });
}
