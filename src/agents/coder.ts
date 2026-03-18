import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { ModelRouter } from '../core/modelRouter';
import { Plan, FileChange } from '../types';

const LANG_HINTS: Record<string, string> = {
  '.go': [
    'LANGUAGE: Go.',
    'RULES:',
    '- Return the complete, compilable Go source file.',
    '- The package declaration MUST match the directory convention (e.g. "package agnostic" for cmd/agnostic/).',
    '- Do NOT redeclare package-level variables that already exist in sibling files of the same package.',
    '  For example: if "backend" or "isolated" are already declared in install.go, do NOT declare them again in a test or other file.',
    '- Do NOT add a second Execute() or init() function if one already exists in the package.',
    '- If main.go already delegates to a sub-package (e.g. agnostic.Execute()), preserve that pattern. Do NOT inline a new rootCmd in main.go.',
    '- Imports must be grouped: stdlib first, then third-party, then internal.',
    '- Do NOT use ioutil (deprecated); use os and io packages instead.',
    '- Do NOT add a trailing newline comment (\\ No newline at end of file).',
  ].join('\n'),
  '.ts': [
    'LANGUAGE: TypeScript.',
    'RULES:',
    '- Return the complete TypeScript file.',
    '- Use ES module imports. No require().',
    '- Strict types, no any unless unavoidable.',
  ].join('\n'),
  '.js': [
    'LANGUAGE: JavaScript.',
    'RULES:',
    '- Return the complete JavaScript file.',
    '- Use ES module syntax.',
  ].join('\n'),
  '.py': [
    'LANGUAGE: Python.',
    'RULES:',
    '- Return the complete Python file.',
    '- Follow PEP 8.',
    '- Use type hints.',
  ].join('\n'),
  '.rs': [
    'LANGUAGE: Rust.',
    'RULES:',
    '- Return the complete Rust file.',
    '- No unwrap() in library code; use Result/Option properly.',
  ].join('\n'),
};

export class CoderAgent {
  constructor(private router: ModelRouter) {}

  async implementPlan(plan: Plan, repoPath: string): Promise<FileChange[]> {
    const changes: FileChange[] = [];

    for (const subtask of plan.subtasks) {
      for (const filePath of subtask.filesToModify) {
        const fullPath = path.join(repoPath, filePath);
        const existingContent = fs.existsSync(fullPath)
          ? fs.readFileSync(fullPath, 'utf-8')
          : '';

        const ext = path.extname(filePath);
        const langRules = LANG_HINTS[ext] ?? `LANGUAGE: ${ext.replace('.', '') || 'unknown'}.`;

        const prompt = [
          'You are a senior software engineer. Implement the task described below.',
          'You MUST respond in English only.',
          '',
          `=== TASK ===`,
          `Title: ${subtask.title}`,
          `Description: ${subtask.description}`,
          subtask.acceptanceCriteria.length > 0
            ? `Acceptance criteria:\n${subtask.acceptanceCriteria.map((c) => `- ${c}`).join('\n')}`
            : '',
          '',
          `=== FILE TO MODIFY ===`,
          `Path: ${filePath}`,
          existingContent
            ? `Current content:\n\`\`\`\n${existingContent}\n\`\`\``
            : 'This is a NEW file.',
          '',
          `=== ${langRules} ===`,
          '',
          '=== OUTPUT RULES ===',
          '- Return ONLY the complete file content inside a single code block.',
          '- Do NOT include any explanation, comments about what you changed, or text outside the code block.',
          '- Do NOT truncate the file. Output the entire file.',
          '- Do NOT wrap the code block in additional markdown.',
        ].filter(Boolean).join('\n');

        console.log(chalk.gray(`  [coder] generating ${filePath}...`));
        const response = await this.router.complete(prompt, 'coding', 3072);
        const code = this.extractCode(response.response);

        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, code, 'utf-8');

        changes.push({
          path: filePath,
          content: code,
          operation: existingContent ? 'update' : 'create',
        });
      }
    }

    return changes;
  }

  private extractCode(text: string): string {
    const match = text.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  }
}
