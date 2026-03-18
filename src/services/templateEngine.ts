import * as fs from 'fs';
import * as path from 'path';
import * as nunjucks from 'nunjucks';

export interface TemplateVars {
  projectName: string;
  author: string;
  language: string;
  framework?: string;
  database?: string;
  includeAuth?: boolean;
  license: string;
  [key: string]: unknown;
}

export class TemplateEngine {
  private env: nunjucks.Environment;
  private templatesDir: string;

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(__dirname, '..', '..', 'templates');
    this.env = new nunjucks.Environment(
      new nunjucks.FileSystemLoader(this.templatesDir, { noCache: true }),
      { autoescape: false, trimBlocks: true, lstripBlocks: true },
    );
  }

  renderTemplate(templateName: string, vars: TemplateVars): string {
    return this.env.render(templateName, vars);
  }

  renderString(template: string, vars: TemplateVars): string {
    return this.env.renderString(template, vars);
  }

  hasTemplate(templateKey: string): boolean {
    return fs.existsSync(path.join(this.templatesDir, templateKey));
  }

  renderDirectory(templateKey: string, outputDir: string, vars: TemplateVars): void {
    const srcDir = path.join(this.templatesDir, templateKey);
    if (!fs.existsSync(srcDir)) {
      throw new Error(`Template not found: ${templateKey}`);
    }
    this.copyAndRender(srcDir, outputDir, vars);
  }

  private copyAndRender(srcDir: string, outDir: string, vars: TemplateVars): void {
    fs.mkdirSync(outDir, { recursive: true });
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destName = this.env.renderString(entry.name, vars);
      const destPath = path.join(outDir, destName);

      if (entry.isDirectory()) {
        this.copyAndRender(srcPath, destPath, vars);
      } else {
        const raw = fs.readFileSync(srcPath, 'utf-8');
        const rendered = this.env.renderString(raw, vars);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, rendered, 'utf-8');
      }
    }
  }
}
