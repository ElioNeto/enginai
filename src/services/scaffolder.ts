import * as fs from 'fs';
import * as path from 'path';
import { ModelRouter } from '../core/modelRouter';
import { AppConfig } from '../types';
import { TemplateEngine, TemplateVars } from './templateEngine';

interface ScaffoldOptions {
  projectType: string;
  name: string;
  language: string;
  framework?: string;
  database?: string;
  includeAuth?: boolean;
}

export class ScaffolderService {
  private templateEngine: TemplateEngine;

  constructor(
    private router: ModelRouter,
    private config: AppConfig,
  ) {
    this.templateEngine = new TemplateEngine();
  }

  async generateStructure(opts: ScaffoldOptions): Promise<string> {
    const projectPath = path.join(process.cwd(), opts.name);
    fs.mkdirSync(projectPath, { recursive: true });

    const vars: TemplateVars = {
      projectName: opts.name,
      author: this.config.defaultAuthor,
      language: opts.language,
      framework: opts.framework,
      database: opts.database,
      includeAuth: opts.includeAuth,
      license: this.config.defaultLicense,
    };

    const templateKey = this.getTemplateKey(opts);

    if (templateKey && this.templateEngine.hasTemplate(templateKey)) {
      this.templateEngine.renderDirectory(templateKey, projectPath, vars);
    } else {
      this.fallbackScaffold(projectPath, opts);
    }

    // Generate README with LLM
    const readme = await this.generateReadme(opts);
    fs.writeFileSync(path.join(projectPath, 'README.md'), readme);

    return projectPath;
  }

  private getTemplateKey(opts: ScaffoldOptions): string | null {
    if (opts.projectType === 'api' && opts.language === 'python') return 'api-fastapi';
    if (opts.projectType === 'api' && opts.language === 'typescript') return 'api-express';
    if (opts.projectType === 'script' && opts.language === 'typescript') return 'script-typescript';
    if (opts.projectType === 'script') return 'script-typescript';
    return null;
  }

  private async generateReadme(opts: ScaffoldOptions): Promise<string> {
    const prompt = `Generate a README.md for project "${opts.name}" (${opts.projectType}, ${opts.language}${opts.framework ? ', ' + opts.framework : ''}). Include: title, description, install, usage, env vars, license. Be concise. Return only markdown.`;
    const res = await this.router.complete(prompt, 'coding', 512);
    return res.response;
  }

  private fallbackScaffold(projectPath: string, opts: ScaffoldOptions): void {
    if (opts.projectType === 'api' && opts.language === 'python') {
      this.createPythonApi(projectPath, opts);
    } else if (opts.projectType === 'api' && opts.language === 'typescript') {
      this.createExpressApi(projectPath, opts);
    } else if (opts.projectType === 'webapp') {
      this.createWebapp(projectPath, opts);
    } else if (opts.projectType === 'script') {
      this.createScript(projectPath, opts);
    }
  }

  private createPythonApi(projectPath: string, opts: ScaffoldOptions): void {
    const src = path.join(projectPath, 'src');
    fs.mkdirSync(src, { recursive: true });
    fs.mkdirSync(path.join(projectPath, 'tests'), { recursive: true });

    fs.writeFileSync(
      path.join(src, 'main.py'),
      `from fastapi import FastAPI\n\napp = FastAPI(title="${opts.name}")\n\n@app.get("/health")\ndef health():\n    return {"status": "healthy"}\n`,
    );

    let requirements = 'fastapi>=0.109.0\nuvicorn[standard]>=0.27.0\n';
    if (opts.database) requirements += 'sqlalchemy>=2.0.0\n';
    if (opts.includeAuth) requirements += 'python-jose[cryptography]>=3.3.0\n';
    fs.writeFileSync(path.join(projectPath, 'requirements.txt'), requirements);

    this.writeDockerfile(projectPath, 'python');
  }

  private createExpressApi(projectPath: string, opts: ScaffoldOptions): void {
    const src = path.join(projectPath, 'src');
    fs.mkdirSync(src, { recursive: true });
    fs.mkdirSync(path.join(projectPath, 'tests'), { recursive: true });

    fs.writeFileSync(
      path.join(src, 'app.ts'),
      `import express from 'express';\n\nconst app = express();\napp.use(express.json());\n\napp.get('/health', (_req, res) => res.json({ status: 'healthy' }));\n\nexport default app;\n`,
    );

    const pkg = {
      name: opts.name,
      version: '1.0.0',
      scripts: { dev: 'ts-node src/app.ts', build: 'tsc', test: 'jest' },
      dependencies: { express: '^4.18.0' },
      devDependencies: { typescript: '^5.5.0', '@types/express': '^4.17.0', 'ts-node': '^10.9.0' },
    };
    fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify(pkg, null, 2));

    this.writeDockerfile(projectPath, 'node');
  }

  private createWebapp(projectPath: string, opts: ScaffoldOptions): void {
    fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true });
    const pkg = {
      name: opts.name,
      version: '1.0.0',
      scripts: { dev: 'ng serve', build: 'ng build', test: 'ng test' },
    };
    fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify(pkg, null, 2));
  }

  private createScript(projectPath: string, opts: ScaffoldOptions): void {
    fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(projectPath, 'src', 'index.ts'),
      `#!/usr/bin/env ts-node\n// ${opts.name}\n\nasync function main(): Promise<void> {\n  console.log('${opts.name} running...');\n}\n\nmain().catch(console.error);\n`,
    );
  }

  private writeDockerfile(projectPath: string, runtime: 'python' | 'node'): void {
    const content =
      runtime === 'python'
        ? `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]\n`
        : `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json .\nRUN npm ci\nCOPY . .\nRUN npm run build\nCMD ["node", "dist/app.js"]\n`;
    fs.writeFileSync(path.join(projectPath, 'Dockerfile'), content);
  }
}
