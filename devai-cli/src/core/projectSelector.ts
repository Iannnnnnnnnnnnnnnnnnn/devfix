import { createInterface } from 'node:readline/promises';
import { createProject, createScene, fetchProjects, fetchScenes } from './api.js';
import type { Project, Scene } from '../types/project.js';

export async function resolveProject(projectName?: string): Promise<Project> {
  const projects = await fetchProjects();
  if (projectName?.trim()) {
    const existing = projects.find((item) => item.name === projectName.trim());
    if (existing) {
      return existing;
    }
    const answer = await ask(`项目「${projectName.trim()}」不存在，是否创建？(y/N)：`);
    if (answer.trim().toLowerCase() === 'y') {
      return createProject(projectName.trim());
    }
    throw new Error('未选择项目。');
  }

  console.log('请选择项目：');
  if (projects.length) {
    projects.forEach((project, index) => console.log(`${index + 1}. ${project.name}`));
  } else {
    console.log('当前没有项目。');
  }
  console.log('n. 新建项目');
  const answer = await ask('输入序号或新项目名：');
  const normalized = answer.trim();
  if (!normalized) {
    throw new Error('未选择项目。');
  }
  if (normalized.toLowerCase() === 'n') {
    const name = (await ask('请输入新项目名：')).trim();
    if (!name) {
      throw new Error('项目名不能为空。');
    }
    return createProject(name);
  }
  const selectedIndex = Number.parseInt(normalized, 10) - 1;
  if (Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < projects.length) {
    return projects[selectedIndex];
  }
  return createProject(normalized);
}

export async function resolveScene(projectId: number, sceneName?: string): Promise<Scene> {
  const scenes = await fetchScenes(projectId);
  if (sceneName?.trim()) {
    const existing = scenes.find((item) => item.name === sceneName.trim());
    if (existing) {
      return existing;
    }
    const answer = await ask(`场景「${sceneName.trim()}」不存在，是否创建？(y/N)：`);
    if (answer.trim().toLowerCase() === 'y') {
      return createScene(projectId, sceneName.trim());
    }
    throw new Error('未选择场景。');
  }

  console.log('请选择场景：');
  if (scenes.length) {
    scenes.forEach((scene, index) => console.log(`${index + 1}. ${scene.name}`));
  } else {
    console.log('当前项目下没有场景。');
  }
  console.log('n. 新建场景');
  const answer = await ask('输入序号或新场景名：');
  const normalized = answer.trim();
  if (!normalized) {
    throw new Error('未选择场景。');
  }
  if (normalized.toLowerCase() === 'n') {
    const name = (await ask('请输入新场景名：')).trim();
    if (!name) {
      throw new Error('场景名不能为空。');
    }
    return createScene(projectId, name);
  }
  const selectedIndex = Number.parseInt(answer.trim(), 10) - 1;
  if (Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < scenes.length) {
    return scenes[selectedIndex];
  }
  return createScene(projectId, normalized);
}

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer;
}
