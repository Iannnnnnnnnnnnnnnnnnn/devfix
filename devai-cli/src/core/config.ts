import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface DevaiConfig {
  apiBaseUrl: string;
  defaultModel?: string;
  debug: boolean;
  autoSaveHistory: boolean;
}

const DEFAULT_API_BASE_URL = 'http://localhost:8088';
const DEFAULT_CONFIG: DevaiConfig = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
  defaultModel: 'deepseek-chat',
  debug: false,
  autoSaveHistory: true,
};

export function loadConfig(): DevaiConfig {
  const fileConfig = readConfigFile();
  return {
    ...DEFAULT_CONFIG,
    ...fileConfig,
    apiBaseUrl: normalizeBaseUrl(process.env.DEVAI_API_BASE_URL || fileConfig.apiBaseUrl || DEFAULT_CONFIG.apiBaseUrl),
  };
}

export function ensureConfigFile(): DevaiConfig {
  const configPath = getConfigPath();
  const config = loadConfig();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  if (!fs.existsSync(configPath)) {
    saveConfig(config);
  }
  return config;
}

export function saveConfig(config: DevaiConfig): void {
  const configPath = getConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify({ ...config, apiBaseUrl: normalizeBaseUrl(config.apiBaseUrl) }, null, 2)}\n`, 'utf8');
}

export function getConfigPath(): string {
  return path.join(os.homedir(), '.devai', 'config.json');
}

export function getTuiLogPath(): string {
  return path.join(os.homedir(), '.devai', 'tui-logs.jsonl');
}

function readConfigFile(): Partial<DevaiConfig> {
  const configPath = path.join(os.homedir(), '.devai', 'config.json');
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Partial<DevaiConfig>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    throw new Error(`配置文件 JSON 格式错误：${configPath}`);
  }
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
