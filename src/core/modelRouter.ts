import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { AppConfig, LLMResponse, TaskType } from '../types';

const MAX_RETRIES = 3;

// Gemini models used only as fallback when Ollama is unavailable
const GEMINI_MODEL_MAP: Record<TaskType, string> = {
  planning: 'gemini-2.5-flash',
  coding:   'gemini-2.5-flash-lite',
  testing:  'gemini-2.5-flash-lite',
  review:   'gemini-2.5-flash-lite',
};

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
    }
    return false;
  }

  private getGeminiModel(taskType: TaskType): string {
    return GEMINI_MODEL_MAP[taskType];
  }

  private getOllamaModel(taskType: TaskType): string {
    const modelMap: Record<TaskType, string> = {
      planning: this.config.ollamaModelPlanner,
      coding:   this.config.ollamaModelCoder,
      testing:  this.config.ollamaModelReviewer,
      review:   this.config.ollamaModelReviewer,
    };
    return modelMap[taskType] || this.config.ollamaModel;
  }

  private parseRetryDelay(errMsg: string): number {
    const match = errMsg.match(/retry[^\d]*(\d+)s/i);
    return match ? parseInt(match[1], 10) + 2 : 65;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async complete(
    prompt: string,
    taskType: TaskType = 'coding',
    maxTokens?: number,
    temperature?: number,
  ): Promise<LLMResponse> {
    this.shouldReset();

    // Resolve effective values: call-site args take priority over env config
    const effectiveTokens     = maxTokens     ?? this.config.ollamaNumPredict;
    const effectiveTemp       = temperature   ?? this.config.ollamaTemperature;
    const effectiveTopP       = this.config.ollamaTopP;
    const effectiveNumCtx     = this.config.ollamaNumCtx;

    // 1. Try Ollama first
    const ollamaModel = this.getOllamaModel(taskType);
    console.log(chalk.gray(
      `  [llm] Ollama: ${ollamaModel} (task: ${taskType}, ctx: ${effectiveNumCtx}, predict: ${effectiveTokens}, temp: ${effectiveTemp})...`
    ));
    try {
      const response = await axios.post(`${this.config.ollamaHost}/api/chat`, {
        model: ollamaModel,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: {
          num_predict: effectiveTokens,
          num_ctx:     effectiveNumCtx,
          temperature: effectiveTemp,
          top_p:       effectiveTopP,
        },
      });
      const text = response.data.message.content as string;
      console.log(chalk.gray(`  [llm] ✓ Ollama responded (${text.length} chars)`));
      return { response: text, model: ollamaModel, provider: 'ollama' };
    } catch (err) {
      const msg = (err as Error).message ?? '';
      console.warn(chalk.yellow(`  [llm] Ollama unavailable: ${msg}`));
      console.warn(chalk.yellow(`  [llm] Falling back to Gemini...`));
    }

    // 2. Fallback: Gemini with retry on 429
    if (!this.config.geminiApiKey) {
      throw new Error('Ollama is unavailable and no GEMINI_API_KEY is configured.');
    }

    const geminiModel = this.getGeminiModel(taskType);
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(chalk.gray(`  [llm] Gemini: ${geminiModel} (attempt ${attempt}/${MAX_RETRIES})...`));
        const model = this.gemini.getGenerativeModel({
          model: geminiModel,
          generationConfig: { maxOutputTokens: effectiveTokens, temperature: effectiveTemp },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        this.stats.geminiRequests += 1;
        this.saveStats();
        console.log(chalk.gray(`  [llm] ✓ Gemini responded (${text.length} chars, total today: ${this.stats.geminiRequests})`));
        return { response: text, model: geminiModel, provider: 'gemini' };
      } catch (err) {
        const msg = (err as Error).message ?? '';
        if (msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('RESOURCE_EXHAUSTED')) {
          const delaySec = this.parseRetryDelay(msg);
          console.warn(chalk.yellow(`  [llm] Gemini 429 — waiting ${delaySec}s then retry ${attempt}/${MAX_RETRIES}...`));
          await this.sleep(delaySec * 1000);
        } else {
          console.warn(chalk.yellow(`  [llm] Gemini non-retryable error: ${msg}`));
          break;
        }
      }
    }

    throw new Error(`All providers failed for task: ${taskType}. Ensure Ollama is running (ollama serve) or check your Gemini API key.`);
  }
}
