import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { AppConfig, LLMResponse, TaskType } from '../types';

interface QuotaStats {
  geminiRequests: number;
  lastReset: string;
}

export class ModelRouter {
  private config: AppConfig;
  private gemini: GoogleGenerativeAI;
  private quotaFile: string;
  private stats: QuotaStats;

  constructor(config: AppConfig) {
    this.config = config;
    this.gemini = new GoogleGenerativeAI(config.geminiApiKey);
    this.quotaFile = path.join(os.homedir(), '.enginai', 'quota.json');
    fs.mkdirSync(path.dirname(this.quotaFile), { recursive: true });
    this.stats = this.loadStats();
  }

  private loadStats(): QuotaStats {
    if (fs.existsSync(this.quotaFile)) {
      return JSON.parse(fs.readFileSync(this.quotaFile, 'utf-8'));
    }
    return { geminiRequests: 0, lastReset: new Date().toISOString() };
  }

  private saveStats(): void {
    fs.writeFileSync(this.quotaFile, JSON.stringify(this.stats, null, 2));
  }

  private shouldReset(): boolean {
    const lastReset = new Date(this.stats.lastReset);
    const now = new Date();
    const diffDays = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays >= 1) {
      this.stats.geminiRequests = 0;
      this.stats.lastReset = now.toISOString();
      this.saveStats();
      return true;
    }
    return false;
  }

  private getGeminiModel(taskType: TaskType): string {
    const modelMap: Record<TaskType, string> = {
      planning: 'gemini-1.5-pro',
      coding: 'gemini-1.5-pro',
      testing: 'gemini-1.5-flash',
      review: 'gemini-1.5-flash',
    };
    return modelMap[taskType];
  }

  async complete(
    prompt: string,
    taskType: TaskType = 'coding',
    maxTokens: number = 2048,
    temperature: number = 0.7,
  ): Promise<LLMResponse> {
    this.shouldReset();

    // Try Gemini first
    if (this.stats.geminiRequests < this.config.geminiDailyLimit && this.config.geminiApiKey) {
      try {
        const modelName = this.getGeminiModel(taskType);
        const model = this.gemini.getGenerativeModel({
          model: modelName,
          generationConfig: { maxOutputTokens: maxTokens, temperature },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        this.stats.geminiRequests += 1;
        this.saveStats();
        return { response: text, model: modelName, provider: 'gemini' };
      } catch (err) {
        console.warn(`⚠️  Gemini failed: ${err}, falling back to Ollama...`);
      }
    }

    // Fallback: Ollama
    const response = await axios.post(`${this.config.ollamaHost}/api/generate`, {
      model: this.config.ollamaModel,
      prompt,
      stream: false,
      options: { num_predict: maxTokens, temperature },
    });
    return {
      response: response.data.response,
      model: this.config.ollamaModel,
      provider: 'ollama',
    };
  }
}
