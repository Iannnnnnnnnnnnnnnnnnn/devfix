export interface HistorySummary {
  id: number;
  source?: string;
  summary?: string;
  errorType?: string;
  createdAt?: string;
}

export interface HistoryListResponse {
  list: HistorySummary[];
}

export interface HistoryDetailResponse extends HistorySummary {
  question?: string;
  rawContent?: string;
  resultJson?: string;
  modelName?: string;
  updatedAt?: string;
}

export interface LogHistoryItem {
  id: number;
  projectId?: number;
  sceneId?: number;
  source?: string;
  question?: string;
  summary?: string;
  errorType?: string;
  createdAt?: string;
}

export interface CommandHistoryItem {
  id: number;
  projectId?: number;
  sceneId?: number;
  environment?: string;
  source?: string;
  keyword?: string;
  question?: string;
  summary?: string;
  createdAt?: string;
}
