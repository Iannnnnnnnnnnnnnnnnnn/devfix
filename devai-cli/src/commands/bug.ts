import { createInterface } from 'node:readline/promises';
import type { Command } from 'commander';
import {
  createBugIssue,
  fetchBugIssues,
  saveBugRecord,
  searchBugArchive,
  summarizeBugRecord,
} from '../core/api.js';
import { handleCliError } from '../core/errorHandler.js';
import { resolveProject, resolveScene } from '../core/projectSelector.js';
import type { BugIssue } from '../types/bug.js';

interface BugCreateOptions {
  project?: string;
  scene?: string;
  name?: string;
  errorType?: string;
  tags?: string;
}

interface BugNoteOptions {
  project?: string;
  scene?: string;
  issue?: string;
}

interface BugSearchOptions {
  project?: string;
  scene?: string;
}

export function registerBugCommand(program: Command): void {
  const command = program.command('bug').description('管理 Bug 排查记录');

  command
    .command('create')
    .description('创建 Bug 问题')
    .option('--project <name>', '项目名称')
    .option('--scene <name>', '场景名称')
    .option('--name <name>', '问题名称')
    .option('--error-type <type>', '错误类型')
    .option('--tags <tags>', '逗号分隔标签')
    .action(async (options: BugCreateOptions) => {
      try {
        const project = await resolveProject(options.project);
        const scene = await resolveScene(project.id, options.scene);
        const issueName = options.name?.trim() || (await ask('请输入问题名称：')).trim();
        if (!issueName) {
          throw new Error('问题名称不能为空。');
        }
        const result = await createBugIssue({
          projectId: project.id,
          sceneId: scene.id,
          issueName,
          status: 'open',
          errorType: options.errorType,
          tags: parseTags(options.tags),
        });
        console.log(`已创建 Bug 问题：#${result.id} ${issueName}`);
      } catch (error) {
        handleCliError(error);
      }
    });

  command
    .command('note')
    .description('记录 Bug 排查过程')
    .option('--project <name>', '项目名称')
    .option('--scene <name>', '场景名称')
    .option('--issue <name>', '问题名称')
    .action(async (options: BugNoteOptions) => {
      try {
        const project = await resolveProject(options.project);
        const scene = await resolveScene(project.id, options.scene);
        const issue = await resolveIssue(project.id, scene.id, options.issue);
        console.log('请输入排查过程，多行输入，单独一行 ---END--- 结束：');
        const rawContent = (await readMultiline('---END---')).trim();
        if (!rawContent) {
          throw new Error('排查过程不能为空。');
        }
        console.log('正在调用后端 AI 整理...');
        const summary = await summarizeBugRecord({
          projectId: project.id,
          issueId: issue.id,
          rawContent,
          source: 'cli',
        });
        console.log('');
        console.log(summary.aiSummary);
        console.log('');
        const confirm = (await ask('确认保存归档？(Y/n)：')).trim().toLowerCase();
        if (confirm === 'n') {
          console.log('已取消保存。');
          return;
        }
        const result = await saveBugRecord({
          projectId: project.id,
          issueId: issue.id,
          rawContent,
          aiSummary: summary.aiSummary,
          finalContent: summary.aiSummary,
          source: 'cli',
          status: 'resolved',
          errorType: summary.suggestedErrorType || issue.errorType,
          tags: summary.suggestedTags || issue.tags,
        });
        console.log(`已保存排查记录：#${result.id}`);
      } catch (error) {
        handleCliError(error);
      }
    });

  command
    .command('search')
    .description('搜索 Bug 档案')
    .argument('<keyword>', '搜索关键词')
    .option('--project <name>', '项目名称')
    .option('--scene <name>', '场景名称')
    .action(async (keyword: string, options: BugSearchOptions) => {
      try {
        const project = options.project ? await resolveProject(options.project) : null;
        const scene = project ? await resolveScene(project.id, options.scene) : null;
        const result = await searchBugArchive(keyword, project?.id, scene?.id);
        if (!result.list.length) {
          console.log('暂无匹配的 Bug 档案。');
          return;
        }
        result.list.forEach((item) => {
          console.log(`${item.projectName} / ${item.sceneName || `场景 #${item.sceneId}`} / ${item.issueName}`);
          console.log(`命中：${item.hitContent || '-'}`);
          console.log(`时间：${item.recordTime || '-'}`);
          console.log('');
        });
      } catch (error) {
        handleCliError(error);
      }
    });
}

async function resolveIssue(projectId: number, sceneId: number, issueName?: string): Promise<BugIssue> {
  const issues = await fetchBugIssues(projectId, sceneId, issueName);
  if (issueName?.trim()) {
    const existing = issues.list.find((item) => item.issueName === issueName.trim());
    if (existing) {
      return existing;
    }
    const answer = await ask(`问题「${issueName.trim()}」不存在，是否创建？(y/N)：`);
    if (answer.trim().toLowerCase() === 'y') {
      const result = await createBugIssue({ projectId, sceneId, issueName: issueName.trim(), status: 'open' });
      return { id: result.id, projectId, sceneId, issueName: issueName.trim(), status: 'open', tags: [] };
    }
    throw new Error('未选择 Bug 问题。');
  }
  if (issues.list.length === 0) {
    const name = (await ask('当前项目暂无 Bug 问题，请输入新问题名称：')).trim();
    if (!name) {
      throw new Error('问题名称不能为空。');
    }
    const result = await createBugIssue({ projectId, sceneId, issueName: name, status: 'open' });
    return { id: result.id, projectId, sceneId, issueName: name, status: 'open', tags: [] };
  }
  console.log('请选择 Bug 问题：');
  issues.list.forEach((issue, index) => console.log(`${index + 1}. ${issue.issueName}`));
  const answer = await ask('输入序号，或输入新问题名称：');
  const selectedIndex = Number.parseInt(answer.trim(), 10) - 1;
  if (Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < issues.list.length) {
    return issues.list[selectedIndex];
  }
  const name = answer.trim();
  if (!name) {
    throw new Error('未选择 Bug 问题。');
  }
  const result = await createBugIssue({ projectId, sceneId, issueName: name, status: 'open' });
  return { id: result.id, projectId, sceneId, issueName: name, status: 'open', tags: [] };
}

async function readMultiline(endMarker: string): Promise<string> {
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

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer;
}

function parseTags(value?: string): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
