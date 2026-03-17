#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { config } from '../config';
import { MainOrchestrator } from '../core/orchestrator';

const program = new Command();

program
  .name('enginai')
  .description('AI-powered developer agent — creates apps and implements features automatically.')
  .version('0.1.0');

// ─── CREATE ──────────────────────────────────────────────────────────────────
program
  .command('create')
  .description('Create a new project from scratch')
  .requiredOption('-t, --type <type>', 'Project type: api | webapp | script')
  .requiredOption('-n, --name <name>', 'Project name')
  .option('-l, --language <lang>', 'Language: python | typescript', 'python')
  .option('-f, --framework <fw>', 'Framework: fastapi | express | angular | react')
  .option('-d, --database <db>', 'Database: postgres | mysql | sqlite')
  .option('--auth', 'Include authentication module', false)
  .action(async (opts) => {
    const orchestrator = new MainOrchestrator(config);
    const result = await orchestrator.createProject(
      opts.type,
      opts.name,
      opts.language,
      opts.framework,
      opts.database,
      opts.auth,
    );
    if (result.success) {
      console.log(chalk.green(`\n✅ ${result.message}`));
      console.log(chalk.cyan(`📁 Project path: ${result.path}`));
    } else {
      console.error(chalk.red(`\n❌ ${result.message}`));
      process.exit(1);
    }
  });

// ─── IMPLEMENT ────────────────────────────────────────────────────────────────
program
  .command('implement')
  .description('Implement a feature in an existing repository')
  .requiredOption('-r, --repo <url>', 'Repository URL')
  .option('-i, --issue <url>', 'GitHub Issue URL')
  .option('-x, --text <description>', 'Feature description as text')
  .action(async (opts) => {
    if (!opts.issue && !opts.text) {
      console.error(chalk.red('❌ Provide either --issue <url> or --text <description>'));
      process.exit(1);
    }
    const orchestrator = new MainOrchestrator(config);
    const result = await orchestrator.implementFeature(opts.repo, opts.issue, opts.text);
    if (result.success) {
      console.log(chalk.green(`\n✅ ${result.message}`));
      if (result.prUrl) console.log(chalk.cyan(`🔗 PR: ${result.prUrl}`));
    } else {
      console.error(chalk.red(`\n❌ ${result.message}`));
      process.exit(1);
    }
  });

// ─── CONFIG ───────────────────────────────────────────────────────────────────
program
  .command('config')
  .description('Show or validate current configuration')
  .option('--check', 'Validate all required env variables')
  .action((opts) => {
    if (opts.check) {
      const checks = [
        { key: 'GEMINI_API_KEY', val: config.geminiApiKey },
        { key: 'GITHUB_TOKEN', val: config.githubToken },
        { key: 'OLLAMA_HOST', val: config.ollamaHost },
      ];
      checks.forEach(({ key, val }) => {
        if (val) console.log(chalk.green(`  ✅ ${key}`));
        else console.log(chalk.yellow(`  ⚠️  ${key} not set`));
      });
    }
  });

program.parse(process.argv);
