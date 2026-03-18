import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { ModelRouter } from '../core/modelRouter';
import { Plan, FileChange } from '../types';

// Extensions that indicate a file is already a test file — CoderAgent skips these
const TEST_FILE_PATTERNS = [
  /_test\.go$/,
  /\.test\.(ts|js|tsx|jsx)$/,
  /\.spec\.(ts|js|tsx|jsx)$/,
  /^test_.*\.py$/,
  /Test\.java$/,
];

const LANG_HINTS: Record<string, string> = {
  '.go': [
    'LANGUAGE: Go.',
    'RULES:',
    '- Return the complete, compilable Go SOURCE file (NOT a test file).',
    '- The package declaration MUST match the directory (e.g. "package agnostic" for cmd/agnostic/).',
    '- Do NOT import "testing", "bytes" (for test output), or any test-only package.',
    '- Do NOT write TestXxx() functions. This is a production source file.',
    '- Do NOT redeclare package-level variables that already exist in sibling files.',
    '- Do NOT add a second Execute() or init() if one already exists in the package.',
    '- If main.go delegates to a sub-package (e.g. agnostic.Execute()), preserve that. Do NOT inline a new rootCmd in main.go.',
    '- Imports: stdlib first, then third-party, then internal.',
    '- Do NOT use ioutil (deprecated); use os/io instead.',
  ].join('\n'),
  '.ts': [
    'LANGUAGE: TypeScript.',
    'RULES:',
    '- Return the complete TypeScript SOURCE file (NOT a test file).',
    '- Do NOT import jest, vitest, or any test framework.',
    '- Do NOT write describe()/it()/test() blocks.',
    '- Use ES module imports. No require(). Strict types.',
  ].join('\n'),
  '.js': [
    'LANGUAGE: JavaScript.',
    'RULES:',
    '- Return the complete JavaScript SOURCE file (NOT a test file).',
    '- Do NOT import jest, vitest, or any test framework.',
    '- Use ES module syntax.',
  ].join('\n'),
  '.py': [
    'LANGUAGE: Python.',
    'RULES:',
    '- Return the complete Python SOURCE file (NOT a test file).',
    '- Do NOT import pytest or unittest in production code.',
    '- Follow PEP 8. Use type hints.',
  ].join('\n'),
  '.rs': [
    'LANGUAGE: Rust.',
    'RULES:',
    '- Return the complete Rust SOURCE file (NOT a test file).',
    '- No unwrap() in library code. Use Result/Option properly.',
  ].join('\n'),
};

export class CoderAgent {
  constructor(private router: ModelRouter) {}

  async implementPlan(plan: Plan, repoPath: string): Promise<FileChange[]> {
    const changes: FileChange[] = [];

    for (const subtask of plan.subtasks) {
      for (const filePath of subtask.filesToModify) {

        // Guard: skip invalid OS paths (e.g. 'github.com/spf13/cobra')
        if (!this.isValidFilePath(filePath)) {
          console.warn(chalk.yellow(`  [coder] skipping invalid path: "${filePath}"`))
          continue;
        }

        // Guard: skip files that are already test files
        if (this.isTestFile(filePath)) {
          console.log(chalk.gray(`  [coder] skipping test file (handled by TesterAgent): ${filePath}`));
          continue;
        }

        const fullPath = path.join(repoPath, filePath);
        const existingContent = fs.existsSync(fullPath)
          ? fs.readFileSync(fullPath, 'utf-8')
          : '';

        const ext = path.extname(filePath);
        const langRules = LANG_HINTS[ext] ?? `LANGUAGE: ${ext.replace('.', '') || 'unknown'}. Return the complete source file.`;

        const prompt = [
          'You are a senior software engineer. Implement the production source code for the task below.',
          'You MUST respond in English only.',
          '',
          '=== TASK ===',
          `Title: ${subtask.title}`,
          `Description: ${subtask.description}`,
          subtask.acceptanceCriteria.length > 0
            ? `Acceptance criteria:\n${subtask.acceptanceCriteria.map((c) => `- ${c}`).join('\n')}`
            : '',
          '',
          '=== FILE TO MODIFY ===',
          `Path: ${filePath}`,
          existingContent
            ? `Current content:\n\`\`\`\n${existingContent}\n\`\`\``
            : 'This is a NEW file.',
          '',
          `=== ${langRules} ===`,
          '',
          '=== OUTPUT RULES ===',
          '- Return ONLY the complete file content inside a single code block.',
          '- Do NOT write test functions, test imports, or test code of any kind.',
          '- Do NOT include explanations or text outside the code block.',
          '- Do NOT truncate. Output the entire file.',
        ].filter(Boolean).join('\n');

        console.log(chalk.gray(`  [coder] generating ${filePath}...`));
        const response = await this.router.complete(prompt, 'coding', 4096);
        const code = this.extractCode(response.response);

        // Validate: reject output that looks like test code injected into source
        const rejection = this.detectInvalidOutput(code, filePath, existingContent);
        if (rejection) {
          console.warn(chalk.yellow(`  [coder] ⚠ rejected output for ${filePath}: ${rejection}`));
          console.warn(chalk.yellow(`  [coder] preserving original file content`));
          // Keep original on disk, still record as change with original content
          if (existingContent) {
            changes.push({ path: filePath, content: existingContent, operation: 'update' });
          }
          continue;
        }

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

  /**
   * Reject paths that are not valid relative file paths.
   * Catches hallucinated paths like 'github.com/spf13/cobra' or 'gopkg.in/yaml.v3'.
   */
  private isValidFilePath(filePath: string): boolean {
    // Must have a file extension OR be a known extensionless file (Makefile, Dockerfile)
    const knownExtensionless = new Set(['Makefile', 'Dockerfile', 'Jenkinsfile', 'Procfile']);
    const base = path.basename(filePath);
    const ext = path.extname(filePath);

    if (ext) return true;
    if (knownExtensionless.has(base)) return true;

    // Looks like a Go module path (e.g. 'github.com/foo/bar', 'gopkg.in/yaml.v3')
    if (/^[a-z0-9-]+\.[a-z]{2,}\//.test(filePath)) return false;

    return true;
  }

  /** Returns true if the file path matches a test file pattern. */
  private isTestFile(filePath: string): boolean {
    const base = path.basename(filePath);
    return TEST_FILE_PATTERNS.some((re) => re.test(base));
  }

  /**
   * Returns a rejection reason string if the generated code looks invalid,
   * or null if the code looks acceptable.
   */
  private detectInvalidOutput(code: string, filePath: string, original: string): string | null {
    if (code.trim().length < 20) {
      return 'output too short (likely an error or empty response)';
    }

    const ext = path.extname(filePath);
    const isGoSource = ext === '.go' && !this.isTestFile(filePath);
    const isTSSource = (ext === '.ts' || ext === '.js') && !this.isTestFile(filePath);

    if (isGoSource) {
      // Reject if testing package is imported in a production Go file
      if (/^\s*"testing"/.test(code) || /import\s+"testing"/.test(code)) {
        return 'Go source file imports "testing" package — looks like test code';
      }
      // Reject if TestXxx functions appear in a production Go file
      if (/^func Test[A-Z]\w*\(t \*testing\.T\)/m.test(code)) {
        return 'Go source file contains TestXxx() functions — looks like test code';
      }
    }

    if (isTSSource) {
      // Reject if jest/vitest imported in production TS/JS file
      if (/from ['"](jest|vitest|@jest|@testing-library)/.test(code)) {
        return 'TypeScript source file imports test framework — looks like test code';
      }
      if (/^(describe|it|test)\s*\(/.test(code)) {
        return 'TypeScript source file contains test blocks — looks like test code';
      }
    }

    return null;
  }

  private extractCode(text: string): string {
    const match = text.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  }
}
