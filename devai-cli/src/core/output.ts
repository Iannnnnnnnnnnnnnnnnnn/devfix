import chalk from 'chalk';
import type { AnalyzeResponse } from '../types/analyze.js';
import type { CommandSearchResponse } from '../types/command.js';

export function printTitle(title: string): void {
  console.log(chalk.cyan.bold(`\n${title}\n`));
}

export function printSection(title: string, content?: string): void {
  if (!content || !content.trim()) {
    return;
  }
  console.log(chalk.yellow(`【${title}】`));
  console.log(content.trim());
  console.log('');
}

export function printList(title: string, values?: string[]): void {
  const list = (values || []).filter((value) => value && value.trim());
  if (list.length === 0) {
    return;
  }
  console.log(chalk.yellow(`【${title}】`));
  list.forEach((value, index) => {
    console.log(`${index + 1}. ${value}`);
  });
  console.log('');
}

export function printCommand(command: string): void {
  if (command.trim()) {
    console.log(chalk.green(`$ ${command}`));
  }
}

export function printError(message: string): void {
  console.error(chalk.red(message));
}

export function printSuccess(message: string): void {
  console.log(chalk.green(message));
}

export function printAnalyzeResult(result: AnalyzeResponse): void {
  ensureNotEmpty(result);
  printTitle('DevAI 分析结果');
  printSection('报错类型', result.errorType);
  printSection('核心原因', result.cause);
  printList('关键错误行', result.keyLines);
  printSection('可能影响范围', result.impact);
  printList('解决方案', result.solution);

  const commands = (result.commands || []).filter(Boolean);
  if (commands.length > 0) {
    console.log(chalk.yellow('【推荐命令】'));
    commands.forEach(printCommand);
    console.log('');
  }

  printList('相关知识点', result.knowledge);
}

export function printCommandResult(result: CommandSearchResponse): void {
  const commands = result.commands || [];
  if (commands.length === 0) {
    throw new Error('没有查询到匹配的命令，请换一个关键词。');
  }

  printTitle('DevAI 命令查询结果');
  printSection('分类', result.category);
  printSection('场景', result.scenario);
  commands.forEach((item, index) => {
    console.log(chalk.yellow(`【命令 ${index + 1}】`));
    if (item.command) {
      printCommand(item.command);
    }
    if (item.description) {
      console.log(item.description);
    }
    if (item.example && item.example !== item.command) {
      console.log(chalk.gray(`示例：${item.example}`));
    }
    console.log('');
  });
  printList('注意事项', result.tips);
}

function ensureNotEmpty(result: AnalyzeResponse): void {
  const hasContent = Boolean(
    result.errorType ||
      result.cause ||
      result.impact ||
      result.keyLines?.length ||
      result.solution?.length ||
      result.commands?.length ||
      result.knowledge?.length,
  );
  if (!hasContent) {
    throw new Error('AI 返回内容为空，请稍后重试或缩短日志内容。');
  }
}
