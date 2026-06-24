import type { Command } from 'commander';
import { createProject, fetchProjects } from '../core/api.js';
import { handleCliError } from '../core/errorHandler.js';

export function registerProjectCommand(program: Command): void {
  const command = program.command('project').description('管理 DevAI 项目');

  command
    .command('list')
    .description('查看项目列表')
    .action(async () => {
      try {
        const projects = await fetchProjects();
        projects.forEach((project) => console.log(`${project.id}\t${project.name}\t${project.description || ''}`));
      } catch (error) {
        handleCliError(error);
      }
    });

  command
    .command('create')
    .description('创建项目')
    .argument('<name>', '项目名称')
    .action(async (name: string) => {
      try {
        const project = await createProject(name);
        console.log(`已创建项目：${project.id} ${project.name}`);
      } catch (error) {
        handleCliError(error);
      }
    });
}
