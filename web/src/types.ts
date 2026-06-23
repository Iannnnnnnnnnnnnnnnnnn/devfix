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
