export interface CommandSearchItem {
  command?: string;
  description?: string;
  example?: string;
}

export interface CommandSearchResponse {
  category?: string;
  scenario?: string;
  commands?: CommandSearchItem[];
  tips?: string[];
}
