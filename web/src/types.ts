export type RiskLevel = 'safe' | 'warning' | 'danger' | 'blocked' | string;

export interface CommandItem {
  command: string;
  description: string;
  riskLevel: RiskLevel;
  readonly: boolean;
}

export interface DiagnosisResponse {
  id: number;
  summary: string;
  rootCause: string;
  evidence: string[];
  commands: CommandItem[];
  fixSteps: string[];
  warnings: string[];
  needMoreInfo: string[];
}

export interface DiagnosisDetailResponse extends DiagnosisResponse {
  projectName: string;
  errorType: string;
  environment: string;
  rawLog: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryRecord {
  id: number;
  projectName: string;
  errorType: string;
  environment: string;
  summary: string;
  rootCause: string;
  status: string;
  createdAt: string;
}

export interface DiagnosisStats {
  todayCount: number;
  totalCount: number;
}

export interface CommandRecommendResponse {
  commands: CommandItem[];
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  sceneCount?: number;
  recordCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Scene {
  id: number;
  projectId: number;
  projectName?: string;
  name: string;
  description?: string;
  logCount?: number;
  commandCount?: number;
  summaryCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AnalyzeCliResponse {
  id?: number;
  historyId?: number;
  errorType?: string;
  cause?: string;
  keyLines?: string[];
  impact?: string;
  solution?: string[];
  commands?: string[];
  knowledge?: string[];
}

export interface CommandSearchItem {
  command?: string;
  description?: string;
  example?: string;
}

export interface CommandSearchResponse {
  historyId?: number;
  category?: string;
  scenario?: string;
  commands?: CommandSearchItem[];
  tips?: string[];
}

export interface LogHistoryItem {
  id: number;
  projectId: number;
  sceneId: number;
  source?: string;
  question?: string;
  summary?: string;
  errorType?: string;
  keyLines?: string;
  solution?: string;
  resultJson?: string;
  modelName?: string;
  createdAt?: string;
}

export interface CommandHistoryItem {
  id: number;
  projectId: number;
  sceneId: number;
  environment?: string;
  source?: string;
  keyword?: string;
  question?: string;
  summary?: string;
  resultJson?: string;
  modelName?: string;
  createdAt?: string;
}

export interface SummaryDoc {
  id: number;
  projectId: number;
  sceneId?: number;
  summaryType: 'command' | 'log_problem' | string;
  environment?: string;
  title?: string;
  content?: string;
  tags?: string;
  sourceCount?: number;
  sourceIds?: string;
  modelName?: string;
  importSource?: string;
  originalFileName?: string;
  contentHash?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SummaryExportProject {
  id?: number;
  name?: string;
  description?: string;
}

export interface SummaryExportScene {
  id?: number;
  name?: string;
  description?: string;
}

export interface SummaryExportSummary {
  id?: number;
  summaryType?: 'command' | 'log_problem' | string;
  environment?: string;
  title?: string;
  content?: string;
  tags?: string[];
  sourceCount?: number;
  sourceIds?: number[];
  modelName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SummaryImportPreview {
  format: string;
  version: string;
  projectInFile?: SummaryExportProject;
  sceneInFile?: SummaryExportScene;
  summaryInFile?: SummaryExportSummary;
  items?: SummaryExportSummary[];
  availableProjects: Project[];
  availableEnvironments: string[];
}

export interface SummaryImportResult {
  id?: number;
  title?: string;
  projectId?: number;
  sceneId?: number;
  summaryType?: string;
  environment?: string;
  successCount?: number;
  failCount?: number;
  failedItems?: string[];
}

export interface BugRecord {
  id: number;
  issueId: number;
  projectId: number;
  source?: string;
  rawContent?: string;
  aiSummary?: string;
  finalContent?: string;
  modelName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BugIssue {
  id: number;
  projectId: number;
  projectName?: string;
  sceneId: number;
  sceneName?: string;
  issueName: string;
  status: 'open' | 'resolved' | 'archived' | string;
  errorType?: string;
  tags: string[];
  summary?: string;
  createdAt?: string;
  updatedAt?: string;
  records?: BugRecord[];
}

export interface BugIssueListResponse {
  list: BugIssue[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface BugIssueType {
  errorType: string;
  count: number;
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
