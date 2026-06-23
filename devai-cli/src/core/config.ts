import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface DevaiConfig {
  apiBaseUrl: string;
  defaultModel?: string;
}

const DEFAULT_API_BASE_URL = 'http://localhost:8088';

export function loadConfig(): DevaiConfig {
  const fileConfig = readConfigFile();
  return {
    apiBaseUrl: normalizeBaseUrl(process.env.DEVAI_API_BASE_URL || fileConfig.apiBaseUrl || DEFAULT_API_BASE_URL),
    defaultModel: fileConfig.defaultModel,
  };
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
    return {};
  }
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
