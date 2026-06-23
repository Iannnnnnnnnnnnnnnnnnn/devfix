import axios, { AxiosError } from 'axios';
import { loadConfig } from './config.js';
import type { AnalyzeResponse } from '../types/analyze.js';
import type { CommandSearchResponse } from '../types/command.js';

interface ApiErrorBody {
  message?: string;
}

const config = loadConfig();

const client = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function analyzePastedLog(content: string): Promise<AnalyzeResponse> {
  const response = await client.post<AnalyzeResponse>('/api/analyze/log', {
    content,
    source: 'cli-paste',
  });
  return response.data;
}

export async function analyzeFileContent(fileName: string, content: string): Promise<AnalyzeResponse> {
  const response = await client.post<AnalyzeResponse>('/api/analyze/file', {
    fileName,
    content,
    source: 'cli-file',
  });
  return response.data;
}

export async function searchCommand(keyword: string): Promise<CommandSearchResponse> {
  const response = await client.post<CommandSearchResponse>('/api/cmd/search', {
    keyword,
  });
  return response.data;
}

export function toUserFriendlyApiError(error: unknown): Error {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error(String(error));
  }

  const axiosError = error as AxiosError<ApiErrorBody>;
  if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNABORTED') {
    return new Error(
      [
        'DevAI 无法连接本地后端服务。',
        '',
        '请确认后端是否已经启动：',
        'cd backend',
        'mvn spring-boot:run',
        '',
        `当前后端地址：${config.apiBaseUrl}`,
        '如需覆盖：DEVAI_API_BASE_URL=http://localhost:8088',
      ].join('\n'),
    );
  }

  const status = axiosError.response?.status;
  const message = axiosError.response?.data?.message;
  if (status) {
    return new Error(message || `后端请求失败：HTTP ${status}`);
  }
  return new Error(axiosError.message || '网络请求失败');
}
