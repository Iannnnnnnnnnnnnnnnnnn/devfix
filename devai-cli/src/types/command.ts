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
