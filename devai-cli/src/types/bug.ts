export interface BugIssue {
  id: number;
  projectId: number;
  projectName?: string;
  sceneId: number;
  sceneName?: string;
  issueName: string;
  status?: string;
  errorType?: string;
  tags?: string[];
  summary?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BugIssueListResponse {
  list: BugIssue[];
  total: number;
}

export interface BugSummarizeResponse {
  aiSummary: string;
  suggestedTitle?: string;
  suggestedErrorType?: string;
  suggestedTags?: string[];
}

export interface BugSearchItem {
  projectId: number;
  projectName: string;
  sceneId: number;
  sceneName: string;
  issueId: number;
  issueName: string;
  recordId?: number;
  hitContent?: string;
  recordTime?: string;
}

export interface BugSearchResponse {
  list: BugSearchItem[];
  total: number;
}
