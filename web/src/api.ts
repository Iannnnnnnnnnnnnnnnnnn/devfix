import type {
  CommandRecommendResponse,
  DiagnosisDetailResponse,
  DiagnosisResponse,
  DiagnosisStats,
  HistoryRecord,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088';

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
  return response.json() as Promise<T>;
}

export function analyzeLog(payload: {
  projectName: string;
  errorType: string;
  environment: string;
  logContent: string;
}) {
  return request<DiagnosisResponse>('/api/diagnosis/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function recommendCommand(payload: { question: string; environment: string }) {
  return request<CommandRecommendResponse>('/api/command/recommend', {
    method: 'POST',
    body: JSON.stringify(payload),
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
