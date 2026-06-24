import axios, { AxiosError } from 'axios';
import { loadConfig } from './config.js';
import type { AnalyzeResponse } from '../types/analyze.js';
import type { BugIssueListResponse, BugSearchResponse, BugSummarizeResponse } from '../types/bug.js';
import type { CommandSearchResponse } from '../types/command.js';
import type { Project, Scene } from '../types/project.js';

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

export async function analyzePastedLog(
  content: string,
  source = 'cli-paste',
  modelName?: string,
  projectId?: number,
  sceneId?: number,
): Promise<AnalyzeResponse> {
  const response = await client.post<ApiEnvelope<AnalyzeResponse> | AnalyzeResponse>('/api/analyze/log', {
    content,
    source,
    modelName,
    projectId,
    sceneId,
  });
  return unwrapResponse(response.data);
}

export async function analyzeFileContent(
  fileName: string,
  content: string,
  source = 'cli-file',
  modelName?: string,
  projectId?: number,
  sceneId?: number,
): Promise<AnalyzeResponse> {
  const response = await client.post<ApiEnvelope<AnalyzeResponse> | AnalyzeResponse>('/api/analyze/file', {
    fileName,
    content,
    source,
    modelName,
    projectId,
    sceneId,
  });
  return unwrapResponse(response.data);
}

export async function searchCommand(
  keyword: string,
  source = 'cli-cmd',
  modelName?: string,
  projectId?: number,
  sceneId?: number,
): Promise<CommandSearchResponse> {
  const response = await client.post<ApiEnvelope<CommandSearchResponse> | CommandSearchResponse>('/api/cmd/search', {
    keyword,
    question: keyword,
    source,
    modelName,
    projectId,
    sceneId,
  });
  return unwrapResponse(response.data);
}

export async function fetchProjects(): Promise<Project[]> {
  const response = await client.get<ApiEnvelope<Project[]>>('/api/projects');
  return unwrapResponse(response.data);
}

export async function createProject(name: string, description = ''): Promise<Project> {
  const response = await client.post<ApiEnvelope<Project>>('/api/projects', { name, description });
  return unwrapResponse(response.data);
}

export async function fetchScenes(projectId: number): Promise<Scene[]> {
  const response = await client.get<ApiEnvelope<Scene[]>>(`/api/projects/${projectId}/scenes`);
  return unwrapResponse(response.data);
}

export async function createScene(projectId: number, name: string, description = ''): Promise<Scene> {
  const response = await client.post<ApiEnvelope<Scene>>(`/api/projects/${projectId}/scenes`, { name, description });
  return unwrapResponse(response.data);
}

export async function generateCommandSummary(projectId: number, sceneId?: number): Promise<{ content?: string; title?: string }> {
  const response = await client.post<ApiEnvelope<{ content?: string; title?: string }>>('/api/summary/commands/generate', {
    projectId,
    sceneId,
  });
  return unwrapResponse(response.data);
}

export async function generateLogSummary(projectId: number, sceneId?: number): Promise<{ content?: string; title?: string }> {
  const response = await client.post<ApiEnvelope<{ content?: string; title?: string }>>('/api/summary/logs/generate', {
    projectId,
    sceneId,
  });
  return unwrapResponse(response.data);
}

export async function exportSummaryDoc(id: number): Promise<Buffer> {
  const response = await client.get<ArrayBuffer>(`/api/summary/docs/${id}/export`, {
    responseType: 'arraybuffer',
  });
  return Buffer.from(response.data);
}

export async function importSummaryDoc(payload: {
  fileName: string;
  fileContent: Buffer;
  projectId: number;
  sceneId: number;
  summaryType?: string;
  environment?: string;
  title?: string;
  tags?: string;
  allowDuplicate?: boolean;
}): Promise<{ id?: number; title?: string; successCount?: number; failCount?: number }> {
  const formData = new FormData();
  const fileBytes = payload.fileContent.buffer.slice(
    payload.fileContent.byteOffset,
    payload.fileContent.byteOffset + payload.fileContent.byteLength,
  ) as ArrayBuffer;
  formData.append('file', new Blob([fileBytes]), payload.fileName);
  formData.append('projectId', String(payload.projectId));
  formData.append('sceneId', String(payload.sceneId));
  if (payload.summaryType) {
    formData.append('summaryType', payload.summaryType);
  }
  if (payload.environment) {
    formData.append('environment', payload.environment);
  }
  if (payload.title) {
    formData.append('title', payload.title);
  }
  if (payload.tags) {
    formData.append('tags', payload.tags);
  }
  if (payload.allowDuplicate) {
    formData.append('allowDuplicate', 'true');
  }
  formData.append('importSource', 'cli_import');
  const response = await client.post<ApiEnvelope<{ id?: number; title?: string; successCount?: number; failCount?: number }>>(
    '/api/summary/docs/import/confirm',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return unwrapResponse(response.data);
}

export async function fetchSummaryDocs(projectId: number, sceneId?: number): Promise<Array<{ id: number; title?: string; summaryType?: string; sceneId?: number; createdAt?: string }>> {
  const response = await client.get<ApiEnvelope<Array<{ id: number; title?: string; summaryType?: string; environment?: string; createdAt?: string }>>>(
    '/api/summary/docs',
    { params: { projectId, sceneId, page: 1, pageSize: 100 } },
  );
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

export async function fetchLogHistory(projectId: number, sceneId?: number): Promise<import('../types/history.js').LogHistoryItem[]> {
  const response = await client.get<ApiEnvelope<import('../types/history.js').LogHistoryItem[]>>('/api/history/logs', {
    params: { projectId, sceneId, page: 1, pageSize: 20 },
  });
  return unwrapResponse(response.data);
}

export async function fetchCommandHistory(projectId: number, sceneId?: number): Promise<import('../types/history.js').CommandHistoryItem[]> {
  const response = await client.get<ApiEnvelope<import('../types/history.js').CommandHistoryItem[]>>('/api/history/commands', {
    params: { projectId, sceneId, page: 1, pageSize: 20 },
  });
  return unwrapResponse(response.data);
}

export async function generateKnowledge(source = 'tui-manual'): Promise<{ message?: string }> {
  const response = await client.post<ApiEnvelope<{ message?: string }>>('/api/knowledge/generate', { source });
  return unwrapResponse(response.data);
}

export async function createBugIssue(payload: {
  projectId: number;
  sceneId: number;
  issueName: string;
  status?: string;
  errorType?: string;
  tags?: string[];
}): Promise<{ id: number }> {
  const response = await client.post<ApiEnvelope<{ id: number }>>('/api/bug/issues', payload);
  return unwrapResponse(response.data);
}

export async function fetchBugIssues(projectId: number, sceneId?: number, keyword?: string): Promise<BugIssueListResponse> {
  const response = await client.get<ApiEnvelope<BugIssueListResponse>>('/api/bug/issues', {
    params: { projectId, sceneId, keyword, page: 1, pageSize: 100 },
  });
  return unwrapResponse(response.data);
}

export async function summarizeBugRecord(payload: {
  projectId: number;
  issueId: number;
  rawContent: string;
  source?: string;
}): Promise<BugSummarizeResponse> {
  const response = await client.post<ApiEnvelope<BugSummarizeResponse>>('/api/bug/investigations/summarize', payload);
  return unwrapResponse(response.data);
}

export async function saveBugRecord(payload: {
  projectId: number;
  issueId: number;
  rawContent: string;
  aiSummary: string;
  finalContent: string;
  source?: string;
  status?: string;
  errorType?: string;
  tags?: string[];
}): Promise<{ id: number }> {
  const response = await client.post<ApiEnvelope<{ id: number }>>('/api/bug/investigations', payload);
  return unwrapResponse(response.data);
}

export async function searchBugArchive(keyword: string, projectId?: number, sceneId?: number): Promise<BugSearchResponse> {
  const response = await client.get<ApiEnvelope<BugSearchResponse>>('/api/bug/search', {
    params: { projectId, sceneId, keyword, page: 1, pageSize: 20 },
  });
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
