import * as dotenv from 'dotenv';
import * as path from 'path';
import * as os from 'os';
import { AppConfig } from '../types';

dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env variable: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config: AppConfig = {
  appEnv: optional('APP_ENV', 'dev'),
  logLevel: optional('LOG_LEVEL', 'INFO'),
  workdir: optional('WORKDIR', path.join(os.homedir(), '.enginai', 'workspace')),
  githubToken: optional('GITHUB_TOKEN', ''),
  defaultBaseBranch: optional('DEFAULT_BASE_BRANCH', 'main'),
  createDraftPr: optional('CREATE_DRAFT_PR', 'false') === 'true',
  geminiApiKey: optional('GEMINI_API_KEY', ''),
  geminiDailyLimit: parseInt(optional('GEMINI_DAILY_LIMIT', '1450')),
  ollamaHost: optional('OLLAMA_HOST', 'http://localhost:11434'),
  ollamaModel: optional('OLLAMA_MODEL', 'codellama'),
  templatesDir: optional('TEMPLATES_DIR', path.join(os.homedir(), '.enginai', 'templates')),
  defaultAuthor: optional('DEFAULT_AUTHOR', 'EnginAI User'),
  defaultLicense: optional('DEFAULT_LICENSE', 'MIT'),
};
