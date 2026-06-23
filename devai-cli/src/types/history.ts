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
