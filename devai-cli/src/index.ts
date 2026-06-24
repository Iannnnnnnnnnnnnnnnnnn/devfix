#!/usr/bin/env node
import { Command } from 'commander';
import { registerAnalyzeCommand } from './commands/analyze.js';
import { registerBugCommand } from './commands/bug.js';
import { registerCmdCommand } from './commands/cmd.js';
import { registerPasteCommand } from './commands/paste.js';
import { registerProjectCommand } from './commands/project.js';
import { registerSceneCommand } from './commands/scene.js';
import { registerSummaryCommand } from './commands/summary.js';
import { registerTuiCommand } from './commands/tui.js';

const program = new Command();

program
  .name('devai')
  .description('DevAI 终端报错分析助手')
  .version('0.1.0');

registerPasteCommand(program);
registerCmdCommand(program);
registerAnalyzeCommand(program);
registerProjectCommand(program);
registerSceneCommand(program);
registerSummaryCommand(program);
registerBugCommand(program);
registerTuiCommand(program);

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
