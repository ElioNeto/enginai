import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { ModelRouter } from '../core/modelRouter';
import { FileChange } from '../types';

// Extensions that don't need unit tests
const SKIP_EXTENSIONS = new Set(['.mod', '.sum', '.yaml', '.yml', '.json', '.toml', '.lock', '.md', '']);
const SKIP_FILENAMES  = new Set(['Makefile', 'Dockerfile', '.gitignore', '.env']);

interface LangConfig {
  name: string;
  framework: string;
  testExtension: string;
  testPrefix: string;
  testSuffix: string;
  testDir: 'same' | 'tests';
}

const LANG_MAP: Record<string, LangConfig> = {
  '.go': {
    name: 'go', framework: 'testing (stdlib)',
    testExtension: '_test.go', testPrefix: '', testSuffix: '',
    testDir: 'same',
  },
  '.py': {
    name: 'python', framework: 'pytest',
    testExtension: '.py', testPrefix: 'test_', testSuffix: '',
    testDir: 'tests',
  },
  '.ts': {
    name: 'typescript', framework: 'Jest',
    testExtension: '.test.ts', testPrefix: '', testSuffix: '',
    testDir: 'tests',
  },
  '.js': {
    name: 'javascript', framework: 'Jest',
    testExtension: '.test.js', testPrefix: '', testSuffix: '',
    testDir: 'tests',
  },
  '.rs': {
    name: 'rust', framework: '#[cfg(test)]',
    testExtension: '.rs', testPrefix: '', testSuffix: '',
    testDir: 'tests',
  },
  '.java': {
    name: 'java', framework: 'JUnit 5',
    testExtension: 'Test.java', testPrefix: '', testSuffix: '',
    testDir: 'tests',
  },
};

export class TesterAgent {
  constructor(private router: ModelRouter) {}

  async generateTests(changes: FileChange[], repoPath: string): Promise<string[]> {
    const testFiles: string[] = [];
    const written = new Set<string>();

    for (const change of changes) {
      if (change.operation === 'delete') continue;
      if (this.shouldSkip(change.path)) {
        console.log(chalk.gray(`  [tester] skipping non-testable file: ${change.path}`));
        continue;
      }

      const ext = path.extname(change.path);
      const lang = LANG_MAP[ext];
      if (!lang) {
        console.log(chalk.gray(`  [tester] no test strategy for extension '${ext}', skipping`));
        continue;
      }

      const testPath = this.getTestPath(repoPath, change.path, lang);
      if (written.has(testPath)) continue;
      written.add(testPath);

      const prompt = this.buildPrompt(lang, change);
      console.log(chalk.gray(`  [tester] generating ${lang.framework} tests for ${change.path}...`));

      try {
        const response = await this.router.complete(prompt, 'testing', 2048);
        const testCode = this.extractCode(response.response);

        fs.mkdirSync(path.dirname(testPath), { recursive: true });
        fs.writeFileSync(testPath, testCode, 'utf-8');
        testFiles.push(testPath);
        console.log(chalk.gray(`  [tester] wrote ${testPath}`));
      } catch (err) {
        console.warn(chalk.yellow(`  [tester] failed for ${change.path}: ${(err as Error).message}`));
      }
    }

    return testFiles;
  }

  private shouldSkip(filePath: string): boolean {
    const ext  = path.extname(filePath);
    const base = path.basename(filePath);
    return SKIP_EXTENSIONS.has(ext) || SKIP_FILENAMES.has(base);
  }

  private getTestPath(repoPath: string, filePath: string, lang: LangConfig): string {
    const parsed = path.parse(filePath);
    const testName = `${lang.testPrefix}${parsed.name}${lang.testExtension}`;

    if (lang.testDir === 'same') {
      // Go: foo_test.go lives next to foo.go
      return path.join(repoPath, parsed.dir, testName);
    }
    // Others: tests/ directory at repo root
    return path.join(repoPath, 'tests', testName);
  }

  private buildPrompt(lang: LangConfig, change: FileChange): string {
    if (lang.name === 'go') {
      return [
        `Write Go unit tests for the following file using the standard "testing" package.`,
        `File: ${change.path}`,
        '```go',
        change.content,
        '```',
        '',
        'Rules:',
        '- Use table-driven tests ([]struct{ ... }) where applicable.',
        '- Package name must match the source file package.',
        '- Import only "testing" and the packages already used in the source.',
        '- Do NOT use Jest, describe, it(), or any JavaScript/TypeScript syntax.',
        '- Return ONLY the complete Go test file in a ```go code block.',
      ].join('\n');
    }

    if (lang.name === 'python') {
      return [
        `Write pytest unit tests for this Python file.`,
        `File: ${change.path}`,
        '```python',
        change.content,
        '```',
        'Cover happy path + one edge case per function. Return only the test file in a ```python code block.',
      ].join('\n');
    }

    if (lang.name === 'rust') {
      return [
        `Write Rust unit tests using #[cfg(test)] for this file.`,
        `File: ${change.path}`,
        '```rust',
        change.content,
        '```',
        'Add tests inside a mod tests block at the bottom of the file. Return the complete file in a ```rust code block.',
      ].join('\n');
    }

    // JS/TS/Java default
    return [
      `Write ${lang.framework} unit tests for this ${lang.name} file.`,
      `File: ${change.path}`,
      `\`\`\`${lang.name}`,
      change.content,
      '```',
      'Cover happy path + one edge case per function. Return only the test code in a code block.',
    ].join('\n');
  }

  private extractCode(text: string): string {
    const match = text.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  }
}
