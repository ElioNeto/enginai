import * as fs from 'fs';
import * as path from 'path';
import { ModelRouter } from '../core/modelRouter';
import { Plan, FileChange } from '../types';

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

        const prompt = `
You are a senior software engineer. Implement the following subtask.

Subtask: ${subtask.title}
Description: ${subtask.description}
File: ${filePath}

Existing content:
\`\`\`
${existingContent}
\`\`\`

Acceptance criteria:
${subtask.acceptanceCriteria.map((c) => `- ${c}`).join('\n')}

Respond ONLY with the complete updated file content inside a code block.
`;

        const response = await this.router.complete(prompt, 'coding', 3000);
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
    const match = text.match(/```(?:typescript|javascript|python|\w+)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  }
}
