import * as fs from 'fs';
import * as path from 'path';
import { ModelRouter } from '../core/modelRouter';
import { FileChange } from '../types';

export class TesterAgent {
  constructor(private router: ModelRouter) {}

  async generateTests(changes: FileChange[], repoPath: string): Promise<string[]> {
    const testFiles: string[] = [];

    for (const change of changes) {
      if (change.operation === 'delete') continue;

      const lang = this.detectLanguage(change.path);
      const testPath = this.getTestPath(repoPath, change.path);

      const prompt = `
You are a senior software engineer. Generate unit tests for the following ${lang} code.

File: ${change.path}
Code:
\`\`\`${lang}
${change.content}
\`\`\`

Requirements:
- Use ${lang === 'typescript' ? 'Jest + TypeScript' : 'pytest'} conventions
- Cover the happy path and at least one edge case per function
- Respond ONLY with the complete test file content inside a code block
`;

      const response = await this.router.complete(prompt, 'testing', 2048);
      const testCode = this.extractCode(response.response);

      fs.mkdirSync(path.dirname(testPath), { recursive: true });
      fs.writeFileSync(testPath, testCode, 'utf-8');
      testFiles.push(testPath);
    }

    return testFiles;
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath);
    const map: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.py': 'python',
    };
    return map[ext] ?? 'typescript';
  }

  private getTestPath(repoPath: string, filePath: string): string {
    const parsed = path.parse(filePath);
    const testFileName = `${parsed.name}.test${parsed.ext}`;
    return path.join(repoPath, 'tests', testFileName);
  }

  private extractCode(text: string): string {
    const match = text.match(/```(?:typescript|javascript|\w+)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  }
}
