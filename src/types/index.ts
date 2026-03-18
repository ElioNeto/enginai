// ─── Core domain types ───────────────────────────────────────────────────────

export type TaskType = 'planning' | 'coding' | 'testing' | 'review';

export type FileOperation = 'create' | 'update' | 'delete';

export interface LLMResponse {
  response: string;
  model: string;
  provider: 'gemini' | 'ollama';
  tokens?: number;
}

export interface FileChange {
  path: string;
  content: string;
  operation: FileOperation;
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  filesToModify: string[];
  acceptanceCriteria: string[];
}

export interface Plan {
  title: string;
  description: string;
  subtasks: SubTask[];
}

export interface CreateResult {
  path: string;
  success: boolean;
  message: string;
}

export interface ImplementResult {
  success: boolean;
  prUrl?: string;
  message: string;
}

export interface AppConfig {
  appEnv: string;
  logLevel: string;
  workdir: string;
  githubToken: string;
  defaultBaseBranch: string;
  createDraftPr: boolean;
  geminiApiKey: string;
  geminiDailyLimit: number;
  ollamaHost: string;
  ollamaModel: string;
  ollamaModelPlanner: string;
  ollamaModelCoder: string;
  ollamaModelReviewer: string;
  ollamaModelSummarizer: string;
  templatesDir: string;
  defaultAuthor: string;
  defaultLicense: string;
}
