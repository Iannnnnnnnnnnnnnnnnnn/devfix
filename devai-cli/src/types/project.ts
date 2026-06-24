export interface Project {
  id: number;
  name: string;
  description?: string;
}

export interface Scene {
  id: number;
  projectId: number;
  name: string;
  description?: string;
}
