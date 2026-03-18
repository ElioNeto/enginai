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
      'You are a software engineer. Create an implementation plan as a JSON object.',
      '',
      `DEMAND:\n${demand}`,
      '',
      `REPO ROOT FILES: ${repoTree}`,
      fileHints.length > 0 ? `FILES MENTIONED IN DEMAND: ${fileHints.join(', ')}` : '',
      '',
      'Return ONLY valid JSON (no markdown fences, no explanation):',
      '{',
      '  "title": "<short title, no colons or special chars>",',
      '  "description": "<one sentence>",',
      '  "subtasks": [',
      '    {',
      '      "id": "1",',
      '      "title": "<subtask title>",',
      '      "description": "<what to do>",',
      '      "filesToModify": ["relative/path/to/file.ext"],',
      '      "acceptanceCriteria": ["<criterion>"]',
      '    }',
      '  ]',
      '}',
      '',
      'RULES:',
      '- filesToModify entries must be plain relative paths, NO backticks, NO markdown.',
      '- Do NOT truncate the JSON. Output the complete object.',
      fileHints.length > 0
        ? `- At minimum include these files: ${fileHints.join(', ')}`
        : '- Do NOT leave filesToModify empty.',
    ].join('\n');

    console.log(chalk.gray('\n  [debug] sending prompt to LLM...'));
    // Use 4096 tokens to avoid truncation of multi-subtask plans
    const response = await this.router.complete(prompt, 'planning', 4096, 0.3);
    console.log(chalk.gray('  [debug] raw LLM response:'));
    console.log(chalk.gray(response.response));

    const plan = this.extractJson(response.response, demand, fileHints);

    // Sanitize every filesToModify path (strip leading backticks/spaces)
    for (const subtask of plan.subtasks) {
      subtask.filesToModify = this.sanitizeFilePaths(subtask.filesToModify);
    }

    // If LLM still returned no files, fall back to the hints
    if (plan.subtasks.every((t) => t.filesToModify.length === 0) && fileHints.length > 0) {
      console.log(
        chalk.yellow('  [warn] LLM returned empty filesToModify \u2014 using file hints from demand text'),
      );
      plan.subtasks[0].filesToModify = fileHints;
    }

    return plan;
  }

  /**
   * Strip leading backticks, spaces, and other non-path characters from file paths.
   * Deduplicate the resulting list.
   */
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
      .replace(/\s*```\s*$/,  '')
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
          title: 'Implement CLI Bootstrap',
          description: demand,
          filesToModify: fileHints,
          acceptanceCriteria: [],
        } satisfies SubTask,
      ],
    };
  }
}
