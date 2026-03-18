import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { ModelRouter } from '../core/modelRouter';
import { Plan, SubTask } from '../types';

export class PlannerAgent {
  constructor(private router: ModelRouter) {}

  async createPlan(demand: string, repoPath: string): Promise<Plan> {
    // Extract file hints from the demand text (markdown list items with extensions)
    const fileHints = this.extractFileHints(demand);

    // List existing repo files as extra context (top-level only to keep prompt short)
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
      'Return ONLY the JSON below, no explanation, no markdown fences:',
      '{',
      '  "title": "<short title>",',
      '  "description": "<one sentence>",',
      '  "subtasks": [',
      '    {',
      '      "id": "1",',
      '      "title": "<subtask title>",',
      '      "description": "<what to do>",',
      '      "filesToModify": ["<relative/path/to/file>"],',
      '      "acceptanceCriteria": ["<criterion>"]',
      '    }',
      '  ]',
      '}',
      '',
      'IMPORTANT: filesToModify must list every file that needs to be created or changed.',
      fileHints.length > 0
        ? `At minimum include: ${fileHints.join(', ')}`
        : 'Do NOT leave filesToModify empty.',
    ]
      .filter((l) => l !== null)
      .join('\n');

    console.log(chalk.gray('\n  [debug] sending prompt to LLM...'));
    const response = await this.router.complete(prompt, 'planning', 2048, 0.3);
    console.log(chalk.gray('  [debug] raw LLM response:'));
    console.log(chalk.gray(response.response));

    const plan = this.extractJson(response.response, demand, fileHints);

    // If LLM still returned no files, fall back to the hints we extracted
    if (plan.subtasks.every((t) => t.filesToModify.length === 0) && fileHints.length > 0) {
      console.log(
        chalk.yellow('  [warn] LLM returned empty filesToModify — using file hints from demand text'),
      );
      plan.subtasks[0].filesToModify = fileHints;
    }

    return plan;
  }

  private extractFileHints(demand: string): string[] {
    // Match markdown list items that look like file paths: `- path/to/file.ext` or `- \`path\``
    const patterns = [
      /^[-*]\s+`([^`]+\.[a-zA-Z]+)`/gm,
      /^[-*]\s+(\S+\/\S+\.[a-zA-Z]+)/gm,
      /`([a-zA-Z][\w/.-]+\.[a-zA-Z]{1,5})`/g,
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
    // Strip markdown code fences if present
    const stripped = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    // Try direct parse
    try {
      return JSON.parse(stripped) as Plan;
    } catch { /* fall through */ }

    // Try to find the outermost JSON object
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(stripped.slice(start, end + 1)) as Plan;
      } catch { /* fall through */ }
    }

    console.log(chalk.red('  [error] could not parse LLM response as JSON, using fallback plan'));
    return {
      title: 'CLI Bootstrap: Setup go mod, Cobra e comando install',
      description: demand,
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
