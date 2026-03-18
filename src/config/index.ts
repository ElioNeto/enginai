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

function optionalInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

function optionalFloat(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
}

export const config: AppConfig = {
  appEnv:             optional('APP_ENV', 'dev'),
  logLevel:           optional('LOG_LEVEL', 'INFO'),
  workdir:            optional('WORKDIR', path.join(os.homedir(), '.enginai', 'workspace')),
  githubToken:        optional('GITHUB_TOKEN', ''),
  defaultBaseBranch:  optional('DEFAULT_BASE_BRANCH', 'main'),
  createDraftPr:      optional('CREATE_DRAFT_PR', 'false') === 'true',
  geminiApiKey:       optional('GEMINI_API_KEY', ''),
  geminiDailyLimit:   optionalInt('GEMINI_DAILY_LIMIT', 1450),
  ollamaHost:         optional('OLLAMA_HOST', 'http://localhost:11434'),
  ollamaModel:        optional('OLLAMA_MODEL', 'codellama'),
  ollamaModelPlanner:    optional('OLLAMA_MODEL_PLANNER',    'deepseek-r1:7b'),
  ollamaModelCoder:      optional('OLLAMA_MODEL_CODER',      'qwen2.5-coder:7b'),
  ollamaModelReviewer:   optional('OLLAMA_MODEL_REVIEWER',   'qwen2.5-coder:7b'),
  ollamaModelSummarizer: optional('OLLAMA_MODEL_SUMMARIZER', 'qwen2.5-coder:7b'),
  ollamaNumPredict:   optionalInt('OLLAMA_NUM_PREDICT', 4096),
  ollamaNumCtx:       optionalInt('OLLAMA_NUM_CTX', 4096),
  ollamaTemperature:  optionalFloat('OLLAMA_TEMPERATURE', 0.2),
  ollamaTopP:         optionalFloat('OLLAMA_TOP_P', 0.9),
  templatesDir:  optional('TEMPLATES_DIR', path.join(os.homedir(), '.enginai', 'templates')),
  defaultAuthor: optional('DEFAULT_AUTHOR', 'EnginAI User'),
  defaultLicense: optional('DEFAULT_LICENSE', 'MIT'),
};
