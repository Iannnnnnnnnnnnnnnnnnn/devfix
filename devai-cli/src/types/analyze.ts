export interface AnalyzeResponse {
  id?: number;
  errorType?: string;
  cause?: string;
  keyLines?: string[];
  impact?: string;
  solution?: string[];
  commands?: string[];
  knowledge?: string[];
}
