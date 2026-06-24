import type {
  CommandRecommendResponse,
  AnalyzeCliResponse,
  BugIssue,
  BugIssueListResponse,
  BugIssueType,
  BugSearchResponse,
  BugSummarizeResponse,
  CommandHistoryItem,
  CommandSearchResponse,
  DiagnosisDetailResponse,
  DiagnosisResponse,
  DiagnosisStats,
  HistoryRecord,
  LogHistoryItem,
  PageResult,
  Project,
  Scene,
  SummaryDoc,
  SummaryImportPreview,
  SummaryImportResult,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    let message = `请求失败：${response.status}`;
    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      // Keep default message.
    }
    throw new Error(message);
  }
  const payload = await response.json();
  if (payload && typeof payload === 'object' && 'success' in payload) {
    if (payload.success === false) {
      throw new Error(payload.message || '请求失败');
    }
    return payload.data as T;
  }
  return payload as T;
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const payload = await response.json();
  if (payload && typeof payload === 'object' && 'success' in payload) {
    if (payload.success === false) {
      throw new Error(payload.message || '请求失败');
    }
    return payload.data as T;
  }
  return payload as T;
}

async function requestBlob(path: string, options?: RequestInit): Promise<Blob> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.blob();
}

async function readError(response: Response) {
  try {
    const error = await response.json();
    return error.message || `请求失败：${response.status}`;
  } catch {
    return `请求失败：${response.status}`;
  }
}

function normalizePage<T>(payload: PageResult<T> | T[], page: number, pageSize: number): PageResult<T> {
  if (Array.isArray(payload)) {
    const hasNextHint = payload.length >= pageSize;
    return {
      list: payload,
      total: hasNextHint ? page * pageSize + 1 : (page - 1) * pageSize + payload.length,
      page,
      pageSize,
    };
  }
  return {
    list: payload.list || [],
    total: payload.total ?? payload.list?.length ?? 0,
    page: payload.page || page,
    pageSize: payload.pageSize || pageSize,
  };
}

export function analyzeLog(payload: {
  projectId: number;
  sceneId: number;
  content: string;
  source?: string;
}) {
  return request<AnalyzeCliResponse>('/api/analyze/log', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function recommendCommand(payload: { projectId: number; sceneId: number; keyword: string; question: string; source?: string }) {
  return request<CommandSearchResponse>('/api/cmd/search', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchProjects() {
  return request<Project[]>('/api/projects');
}

export function createProject(payload: { name: string; description?: string }) {
  return request<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchScenes(projectId: number) {
  return request<Scene[]>(`/api/projects/${projectId}/scenes`);
}

export function createScene(projectId: number, payload: { name: string; description?: string }) {
  return request<Scene>(`/api/projects/${projectId}/scenes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateScene(id: number, payload: { name: string; description?: string }) {
  return request<Scene>(`/api/scenes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteScene(id: number) {
  return request<void>(`/api/scenes/${id}`, {
    method: 'DELETE',
  });
}

export function deleteHistory(id: number) {
  return request<void>(`/api/history/${id}`, {
    method: 'DELETE',
  });
}

export function fetchHistory() {
  return request<HistoryRecord[]>('/api/diagnosis/history');
}

export function fetchDiagnosisDetail(id: string) {
  return request<DiagnosisDetailResponse>(`/api/diagnosis/${id}`);
}

export function fetchStats() {
  return request<DiagnosisStats>('/api/diagnosis/stats');
}

export async function fetchLogHistory(params: URLSearchParams) {
  const page = Number(params.get('page') || 1);
  const pageSize = Number(params.get('pageSize') || 50);
  const data = await request<PageResult<LogHistoryItem> | LogHistoryItem[]>(`/api/history/logs?${params.toString()}`);
  return normalizePage(data, page, pageSize);
}

export async function fetchCommandHistory(params: URLSearchParams) {
  const page = Number(params.get('page') || 1);
  const pageSize = Number(params.get('pageSize') || 50);
  const data = await request<PageResult<CommandHistoryItem> | CommandHistoryItem[]>(`/api/history/commands?${params.toString()}`);
  return normalizePage(data, page, pageSize);
}

export function generateCommandSummary(payload: { projectId: number; sceneId?: number }) {
  return request<SummaryDoc>('/api/summary/commands/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function generateLogSummary(payload: { projectId: number; sceneId?: number }) {
  return request<SummaryDoc>('/api/summary/logs/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchSummaryDocs(params: URLSearchParams) {
  const page = Number(params.get('page') || 1);
  const pageSize = Number(params.get('pageSize') || 50);
  const data = await request<PageResult<SummaryDoc> | SummaryDoc[]>(`/api/summary/docs?${params.toString()}`);
  return normalizePage(data, page, pageSize);
}

export function exportSummaryDoc(id: number) {
  return requestBlob(`/api/summary/docs/${id}/export`);
}

export function exportSummaryDocs(ids: number[]) {
  return requestBlob('/api/summary/docs/export', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export function previewSummaryImport(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestForm<SummaryImportPreview>('/api/summary/docs/import/preview', formData);
}

export function confirmSummaryImport(payload: {
  file: File;
  projectId: number;
  sceneId: number;
  summaryType?: string;
  environment?: string;
  title?: string;
  tags?: string;
  allowDuplicate?: boolean;
}) {
  const formData = new FormData();
  formData.append('file', payload.file);
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
  return requestForm<SummaryImportResult>('/api/summary/docs/import/confirm', formData);
}

export function deleteSummaryDoc(id: number) {
  return request<void>(`/api/summary/docs/${id}`, {
    method: 'DELETE',
  });
}

export function createBugIssue(payload: {
  projectId: number;
  sceneId: number;
  issueName: string;
  status?: string;
  errorType?: string;
  tags?: string[];
}) {
  return request<{ id: number }>('/api/bug/issues', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchBugIssues(params: URLSearchParams) {
  return request<BugIssueListResponse>(`/api/bug/issues?${params.toString()}`);
}

export function fetchBugIssue(id: number) {
  return request<BugIssue>(`/api/bug/issues/${id}`);
}

export function fetchBugIssueTypes(params: URLSearchParams) {
  const query = params.toString();
  return request<BugIssueType[]>(`/api/bug/issue-types${query ? `?${query}` : ''}`);
}

export function updateBugIssue(
  id: number,
  payload: { issueName?: string; status?: string; errorType?: string; tags?: string[]; summary?: string },
) {
  return request<BugIssue>(`/api/bug/issues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteBugIssue(id: number) {
  return request<void>(`/api/bug/issues/${id}`, {
    method: 'DELETE',
  });
}

export function summarizeBugRecord(payload: { projectId: number; issueId: number; rawContent: string; source?: string }) {
  return request<BugSummarizeResponse>('/api/bug/investigations/summarize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function saveBugRecord(payload: {
  projectId: number;
  issueId: number;
  rawContent?: string;
  aiSummary?: string;
  finalContent: string;
  source?: string;
  modelName?: string;
  status?: string;
  errorType?: string;
  tags?: string[];
  summary?: string;
}) {
  return request<{ id: number }>('/api/bug/investigations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteBugRecord(id: number) {
  return request<void>(`/api/bug/investigations/${id}`, {
    method: 'DELETE',
  });
}

export function searchBugArchive(params: URLSearchParams) {
  return request<BugSearchResponse>(`/api/bug/search?${params.toString()}`);
}
