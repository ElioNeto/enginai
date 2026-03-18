import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { ModelRouter } from '../core/modelRouter';
import { FileChange } from '../types';

const SKIP_EXTENSIONS = new Set(['.mod', '.sum', '.yaml', '.yml', '.json', '.toml', '.lock', '.md', '']);
const SKIP_FILENAMES  = new Set(['Makefile', 'Dockerfile', '.gitignore', '.env']);

interface LangConfig {
  name: string;
  framework: string;
  testExtension: string;
  testPrefix: string;
  testDir: 'same' | 'tests';
}

const LANG_MAP: Record<string, LangConfig> = {
  '.go': {
    name: 'go', framework: 'testing (stdlib)',
    testExtension: '_test.go', testPrefix: '',
    testDir: 'same',
  },
  '.py': {
    name: 'python', framework: 'pytest',
    testExtension: '.py', testPrefix: 'test_',
    testDir: 'tests',
  },
  '.ts': {
    name: 'typescript', framework: 'Jest',
    testExtension: '.test.ts', testPrefix: '',
    testDir: 'tests',
  },
  '.js': {
    name: 'javascript', framework: 'Jest',
    testExtension: '.test.js', testPrefix: '',
    testDir: 'tests',
  },
  '.rs': {
    name: 'rust', framework: '#[cfg(test)]',
    testExtension: '.rs', testPrefix: '',
    testDir: 'tests',
  },
  '.java': {
    name: 'java', framework: 'JUnit 5',
    testExtension: 'Test.java', testPrefix: '',
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
      return path.join(repoPath, parsed.dir, testName);
    }
    return path.join(repoPath, 'tests', testName);
  }

  private buildPrompt(lang: LangConfig, change: FileChange): string {
    if (lang.name === 'go') {
      return [
        'You are a senior Go engineer. Write unit tests for the Go file below.',
        'You MUST respond in English only.',
        '',
        `File: ${change.path}`,
        '```go',
        change.content,
        '```',
        '',
        '=== STRICT RULES ===',
        '1. Use the standard "testing" package only. Do NOT use Jest, describe(), it(), expect(), or any JavaScript/TypeScript syntax.',
        '2. Use table-driven tests ([]struct{ name string; ... }) for all test functions.',
        '3. The package declaration MUST match the source file (same package, not _test suffix unless testing exported API only).',
        '4. Do NOT redeclare any variable that is already declared at package level in the source file.',
        '   - If "backend", "isolated", or any other var is declared in the source, do NOT declare it again in the test file.',
        '5. Do NOT import packages that are not already used in the source file, unless strictly necessary for testing.',
        '6. Do NOT use ioutil (deprecated). Use os and io packages.',
        '7. Return ONLY the complete Go test file in a single ```go code block. No explanation.',
      ].join('\n');
    }

    if (lang.name === 'python') {
      return [
        'You are a senior Python engineer. Write pytest unit tests for the Python file below.',
        'You MUST respond in English only.',
        '',
        `File: ${change.path}`,
        '```python',
        change.content,
        '```',
        '',
        '=== RULES ===',
        '- Cover happy path and one edge case per function.',
        '- Use pytest fixtures where appropriate.',
        '- Return ONLY the complete test file in a single ```python code block. No explanation.',
      ].join('\n');
    }

    if (lang.name === 'rust') {
      return [
        'You are a senior Rust engineer. Write unit tests using #[cfg(test)] for the Rust file below.',
        'You MUST respond in English only.',
        '',
        `File: ${change.path}`,
        '```rust',
        change.content,
        '```',
        '',
        '=== RULES ===',
        '- Add a mod tests block at the bottom of the file.',
        '- Return the COMPLETE file (source + tests) in a single ```rust code block. No explanation.',
      ].join('\n');
    }

    // TypeScript / JavaScript / Java
    return [
      `You are a senior ${lang.name} engineer. Write ${lang.framework} unit tests for the file below.`,
      'You MUST respond in English only.',
      '',
      `File: ${change.path}`,
      `\`\`\`${lang.name}`,
      change.content,
      '```',
      '',
      '=== RULES ===',
      '- Cover happy path and one edge case per exported function.',
      '- Return ONLY the complete test file in a single code block. No explanation.',
    ].join('\n');
  }

  private extractCode(text: string): string {
    const match = text.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  }
}
