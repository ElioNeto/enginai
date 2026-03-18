import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { ModelRouter } from '../core/modelRouter';
import { Plan, SubTask } from '../types';

export class PlannerAgent {
  constructor(private router: ModelRouter) {}

  async createPlan(demand: string, repoPath: string): Promise<Plan> {
    const fileHints = this.extractFileHints(demand);

    let repoTree = '';
    try {
      const entries = fs.readdirSync(repoPath, { withFileTypes: true });
      repoTree = entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name)).join(', ');
    } catch {
      repoTree = '(could not read)';
    }

    const prompt = [
      'You are a senior software engineer. Your task is to produce an implementation plan as a valid JSON object.',
      'You MUST respond in English only. Do NOT use any other language.',
      '',
      '=== DEMAND ===',
      demand,
      '',
      `=== REPOSITORY ROOT ===`,
      repoTree,
      fileHints.length > 0 ? `\n=== FILES MENTIONED IN DEMAND ===\n${fileHints.join(', ')}` : '',
      '',
      '=== OUTPUT FORMAT ===',
      'Return ONLY a single valid JSON object. No markdown fences, no explanation, no text before or after the JSON.',
      '',
      '{',
      '  "title": "<short title — letters, digits, spaces and hyphens ONLY. No colons, commas, quotes or special characters>",',
      '  "description": "<one sentence describing the goal in English>",',
      '  "subtasks": [',
      '    {',
      '      "id": "1",',
      '      "title": "<subtask title in English>",',
      '      "description": "<what to implement, in English>",',
      '      "filesToModify": ["relative/path/to/file.ext"],',
      '      "acceptanceCriteria": ["<verifiable criterion in English>"]',
      '    }',
      '  ]',
      '}',
      '',
      '=== STRICT RULES ===',
      '1. The "title" field MUST NOT contain colons (:), commas (,), backticks (`), quotes, or any special character.',
      '2. Every entry in "filesToModify" MUST be a plain relative path (e.g. "cmd/agnostic/root.go"). NO backticks, NO markdown, NO leading symbols.',
      '3. Do NOT leave "filesToModify" empty in any subtask.',
      '4. Do NOT truncate the JSON. Output the complete object.',
      '5. All string values MUST be in English.',
      fileHints.length > 0
        ? `6. You MUST include at minimum these files: ${fileHints.join(', ')}`
        : '6. Infer which files need to be created or modified from the demand and repo structure.',
    ].join('\n');

    console.log(chalk.gray('\n  [debug] sending prompt to LLM...'));
    const response = await this.router.complete(prompt, 'planning', 4096, 0.2);
    console.log(chalk.gray('  [debug] raw LLM response:'));
    console.log(chalk.gray(response.response));

    const plan = this.extractJson(response.response, demand, fileHints);

    // Sanitize filesToModify paths (strip leading backticks/spaces)
    for (const subtask of plan.subtasks) {
      subtask.filesToModify = this.sanitizeFilePaths(subtask.filesToModify);
    }

    // Fallback: if LLM returned no files, use hints from demand
    if (plan.subtasks.every((t) => t.filesToModify.length === 0) && fileHints.length > 0) {
      console.log(chalk.yellow('  [warn] LLM returned empty filesToModify — using file hints from demand'));
      plan.subtasks[0].filesToModify = fileHints;
    }

    return plan;
  }

  private sanitizeFilePaths(files: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const f of files) {
      const clean = f.replace(/^[`\s]+/, '').replace(/[`\s]+$/, '').trim();
      if (clean.length > 0 && !seen.has(clean)) {
        seen.add(clean);
        result.push(clean);
      }
    }
    return result;
  }

  private extractFileHints(demand: string): string[] {
    const patterns = [
      /^[-*]\s+`([^`]+\.[a-zA-Z]+)`/gm,
      /^[-*]\s+(\S+\/\S+\.[a-zA-Z]+)/gm,
    ];
    const found = new Set<string>();
    for (const re of patterns) {
      for (const m of demand.matchAll(re)) {
        const f = m[1].trim();
        if (!f.startsWith('http') && f.includes('.')) found.add(f);
      }
    }
    return [...found];
  }

  private extractJson(text: string, demand: string, fileHints: string[]): Plan {
    const stripped = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    try {
      return JSON.parse(stripped) as Plan;
    } catch { /* fall through */ }

    const start = stripped.indexOf('{');
    const end   = stripped.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(stripped.slice(start, end + 1)) as Plan;
      } catch { /* fall through */ }
    }

    console.log(chalk.red('  [error] could not parse LLM response as JSON, using fallback plan'));
    return {
      title: 'CLI Bootstrap',
      description: demand.substring(0, 120),
      subtasks: [
        {
          id: '1',
          title: 'Implement feature',
          description: demand,
          filesToModify: fileHints,
          acceptanceCriteria: [],
        } satisfies SubTask,
      ],
    };
  }
}
