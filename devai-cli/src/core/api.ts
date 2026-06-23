import axios, { AxiosError } from 'axios';
import { loadConfig } from './config.js';
import type { AnalyzeResponse } from '../types/analyze.js';
import type { CommandSearchResponse } from '../types/command.js';

interface ApiErrorBody {
  message?: string;
}

const config = loadConfig();
let apiBaseUrl = config.apiBaseUrl;

const client = axios.create({
  baseURL: apiBaseUrl,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

export function setApiBaseUrl(baseUrl: string): void {
  apiBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  client.defaults.baseURL = apiBaseUrl;
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export async function analyzePastedLog(content: string, source = 'cli-paste', modelName?: string): Promise<AnalyzeResponse> {
  const response = await client.post<ApiEnvelope<AnalyzeResponse> | AnalyzeResponse>('/api/analyze/log', {
    content,
    source,
    modelName,
  });
  return unwrapResponse(response.data);
}

export async function analyzeFileContent(
  fileName: string,
  content: string,
  source = 'cli-file',
  modelName?: string,
): Promise<AnalyzeResponse> {
  const response = await client.post<ApiEnvelope<AnalyzeResponse> | AnalyzeResponse>('/api/analyze/file', {
    fileName,
    content,
    source,
    modelName,
  });
  return unwrapResponse(response.data);
}

export async function searchCommand(keyword: string, source = 'cli-cmd', modelName?: string): Promise<CommandSearchResponse> {
  const response = await client.post<ApiEnvelope<CommandSearchResponse> | CommandSearchResponse>('/api/cmd/search', {
    keyword,
    source,
    modelName,
  });
  return unwrapResponse(response.data);
}

export async function fetchRecentHistory(limit = 20): Promise<import('../types/history.js').HistoryListResponse> {
  const response = await client.get<ApiEnvelope<import('../types/history.js').HistoryListResponse>>('/api/history/recent', {
    params: { limit },
  });
  return unwrapResponse(response.data);
}

export async function fetchHistoryDetail(id: number): Promise<import('../types/history.js').HistoryDetailResponse> {
  const response = await client.get<ApiEnvelope<import('../types/history.js').HistoryDetailResponse>>(`/api/history/${id}`);
  return unwrapResponse(response.data);
}

export async function deleteHistory(id: number): Promise<void> {
  const response = await client.delete<ApiEnvelope<null>>(`/api/history/${id}`);
  unwrapResponse(response.data);
}

export async function generateKnowledge(source = 'tui-manual'): Promise<{ message?: string }> {
  const response = await client.post<ApiEnvelope<{ message?: string }>>('/api/knowledge/generate', { source });
  return unwrapResponse(response.data);
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
        `当前后端地址：${apiBaseUrl}`,
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

function unwrapResponse<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.success === false) {
      throw new Error(envelope.message || '后端请求失败');
    }
    if (envelope.data === undefined || envelope.data === null) {
      return {} as T;
    }
    return envelope.data;
  }
  return payload as T;
}
