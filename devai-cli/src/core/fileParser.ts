import fs from 'node:fs/promises';
import path from 'node:path';

const DIRECT_READ_LIMIT_BYTES = 200 * 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const TAIL_LINES = 500;
const KEYWORD_PATTERN = /(ERROR|Exception|Caused by|Traceback|panic|fatal|failed|denied|timeout|refused)/i;
const SUPPORTED_EXTENSIONS = new Set(['.log', '.txt', '.out']);

export async function parseLogFile(filePath: string): Promise<{ fileName: string; content: string }> {
  const resolvedPath = path.resolve(filePath);
  const extension = path.extname(resolvedPath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error('仅支持 .log、.txt、.out 日志文件。');
  }

  let stat;
  try {
    stat = await fs.stat(resolvedPath);
  } catch {
    throw new Error(`文件不存在：${resolvedPath}`);
  }

  if (!stat.isFile()) {
    throw new Error(`不是有效文件：${resolvedPath}`);
  }
  if (stat.size === 0) {
    throw new Error(`文件为空：${resolvedPath}`);
  }
  if (stat.size > MAX_FILE_BYTES) {
    throw new Error('文件过大，请先截取关键日志后再分析。当前 CLI 支持最大 10MB 文件。');
  }

  const content = await fs.readFile(resolvedPath, 'utf8');
  const extracted = stat.size <= DIRECT_READ_LIMIT_BYTES ? content : extractImportantContent(content);
  if (!extracted.trim()) {
    throw new Error('文件中没有可分析的日志内容。');
  }

  return {
    fileName: path.basename(resolvedPath),
    content: extracted,
  };
}

function extractImportantContent(content: string): string {
  const lines = content.split(/\r?\n/);
  const matchedIndexes = lines
    .map((line, index) => (KEYWORD_PATTERN.test(line) ? index : -1))
    .filter((index) => index >= 0);

  if (matchedIndexes.length === 0) {
    return lines.slice(-TAIL_LINES).join('\n');
  }

  const selected = new Set<number>();
  matchedIndexes.forEach((index) => {
    const start = Math.max(0, index - 5);
    const end = Math.min(lines.length - 1, index + 20);
    for (let i = start; i <= end; i += 1) {
      selected.add(i);
    }
  });

  return [...selected]
    .sort((a, b) => a - b)
    .map((index) => lines[index])
    .join('\n');
}
