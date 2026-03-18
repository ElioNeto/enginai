import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { AppConfig, CreateResult, ImplementResult } from '../types';
import { ModelRouter } from './modelRouter';
import { PlannerAgent } from '../agents/planner';
import { CoderAgent } from '../agents/coder';
import { TesterAgent } from '../agents/tester';
import { ScaffolderService } from '../services/scaffolder';
import { RepoManager } from '../adapters/repoManager';
import { GitHubProvider } from '../adapters/githubProvider';

export class MainOrchestrator {
  private router: ModelRouter;
  private planner: PlannerAgent;
  private coder: CoderAgent;
  private tester: TesterAgent;
  private scaffolder: ScaffolderService;
  private repoManager: RepoManager;
  private github: GitHubProvider;

  constructor(private config: AppConfig) {
    this.router = new ModelRouter(config);
    this.planner = new PlannerAgent(this.router);
    this.coder = new CoderAgent(this.router);
    this.tester = new TesterAgent(this.router);
    this.scaffolder = new ScaffolderService(this.router, config);
    this.repoManager = new RepoManager(config);
    this.github = new GitHubProvider(config.githubToken);
  }

  /**
   * Sanitize a string into a valid git branch name.
   * Removes/replaces characters forbidden by git-check-ref-format.
   */
  private sanitizeBranchName(raw: string): string {
    return raw
      .toLowerCase()
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, '-')
      // Remove chars forbidden in git branch names
      .replace(/[:\\,`~^?*[\]@{}<>|"'!#%&;=+]/g, '')
      // Remove control characters and DEL
      .replace(/[\x00-\x1f\x7f]/g, '')
      // Collapse consecutive hyphens/dots
      .replace(/-{2,}/g, '-')
      .replace(/\.{2,}/g, '.')
      // Remove leading/trailing dots, hyphens, slashes
      .replace(/^[\.\-/]+|[\.\-/]+$/g, '')
      // Truncate
      .substring(0, 60);
  }

  async createProject(
    projectType: string,
    name: string,
    language: string,
    framework?: string,
    database?: string,
    includeAuth: boolean = false,
  ): Promise<CreateResult> {
    const spinner = ora('Creating project...').start();
    try {
      const projectPath = await this.scaffolder.generateStructure({
        projectType,
        name,
        language,
        framework,
        database,
        includeAuth,
      });

      await this.repoManager.initRepo(projectPath);
      await this.repoManager.commit(projectPath, 'chore: initial commit');

      spinner.succeed(chalk.green(`Project created: ${projectPath}`));
      return { path: projectPath, success: true, message: `Project ${name} created successfully!` };
    } catch (err) {
      spinner.fail(chalk.red('Failed to create project'));
      return { path: '', success: false, message: `Error: ${(err as Error).message}` };
    }
  }

  async implementFeature(
    repoUrl: string,
    issueUrl?: string,
    text?: string,
  ): Promise<ImplementResult> {
    let issueNumber: number | undefined;

    try {
      // 1. Resolve demand from issue or text
      let demand: string;
      if (issueUrl) {
        const spinner = ora('Fetching GitHub issue...').start();
        try {
          const issue = await this.github.getIssue(issueUrl);
          demand = `${issue.title}\n\n${issue.body}`;
          issueNumber = issue.number;
          spinner.succeed(`Issue #${issue.number}: ${issue.title}`);
        } catch (err) {
          spinner.fail('Failed to fetch issue');
          throw err;
        }
      } else if (text) {
        demand = text;
      } else {
        return { success: false, message: 'Provide either --issue or --text' };
      }

      // 2. Clone
      let spinner = ora('Cloning repository...').start();
      let repoPath: string;
      try {
        repoPath = await this.repoManager.cloneRepo(repoUrl);
        spinner.succeed('Repository cloned');
        console.log(chalk.gray(`  \u2192 cloned to: ${repoPath}`));
      } catch (err) {
        spinner.fail('Failed to clone repository');
        throw err;
      }

      // 3. Plan
      spinner = ora('Creating implementation plan...').start();
      let plan;
      try {
        plan = await this.planner.createPlan(demand, repoPath);
        spinner.succeed(`Plan: ${plan.title} (${plan.subtasks.length} subtasks)`);
      } catch (err) {
        spinner.fail('Failed to create plan');
        throw err;
      }

      console.log(chalk.cyan('\nPlan:'));
      plan.subtasks.forEach((t, i) => {
        console.log(`  ${i + 1}. ${chalk.bold(t.title)}`);
        console.log(`     description : ${t.description.substring(0, 120)}`);
        if (t.filesToModify.length > 0) {
          console.log(`     filesToModify: ${chalk.yellow(t.filesToModify.join(', '))}`);
        } else {
          console.log(chalk.red(`     filesToModify: (empty \u2014 LLM did not list any files!)`));
        }
        if (t.acceptanceCriteria.length > 0) {
          console.log(`     criteria      : ${t.acceptanceCriteria.join(' | ')}`);
        }
      });

      console.log(chalk.gray('\n  [debug] raw plan JSON:'));
      console.log(chalk.gray(JSON.stringify(plan, null, 2)));

      const totalFiles = plan.subtasks.reduce((acc, t) => acc + t.filesToModify.length, 0);
      if (totalFiles === 0) {
        return {
          success: false,
          message:
            'Aborted: the LLM plan has no filesToModify in any subtask. ' +
            'The plan JSON is logged above \u2014 check if the model returned a valid plan.',
        };
      }

      // 4. Implement
      spinner = ora('Implementing code...').start();
      let changes;
      try {
        changes = await this.coder.implementPlan(plan, repoPath);
        spinner.succeed(chalk.green(`${changes.length} files modified`));
      } catch (err) {
        spinner.fail('Failed to implement code');
        throw err;
      }

      if (changes.length === 0) {
        return {
          success: false,
          message: 'Aborted: CoderAgent produced 0 file changes. No PR will be created.',
        };
      }

      console.log(chalk.cyan('\nFiles written:'));
      changes.forEach((c) =>
        console.log(`  ${c.operation === 'create' ? chalk.green('+') : chalk.yellow('~')} ${c.path}`),
      );

      // 5. Tests
      spinner = ora('Generating tests...').start();
      try {
        const testFiles = await this.tester.generateTests(changes, repoPath);
        spinner.succeed(chalk.green(`${testFiles.length} test files created`));
        if (testFiles.length > 0) {
          console.log(chalk.cyan('\nTest files:'));
          testFiles.forEach((f) => console.log(`  + ${f}`));
        }
      } catch (err) {
        spinner.warn('Test generation failed, continuing...');
        console.log(chalk.gray(`  [debug] tester error: ${(err as Error).message}`));
      }

      // 6. Commit + Push + PR
      spinner = ora('Creating branch and PR...').start();
      try {
        const rawBranch = `feature/${plan.title}`;
        const branchName = this.sanitizeBranchName(rawBranch);
        console.log(chalk.gray(`\n  \u2192 branch: ${branchName}`));

        await this.repoManager.createBranch(repoPath, branchName);
        await this.repoManager.commit(repoPath, `feat: ${plan.title}`);

        console.log(chalk.gray(`  \u2192 pushing branch to remote...`));
        await this.repoManager.pushBranch(repoPath, repoUrl, branchName);
        console.log(chalk.gray(`  \u2192 branch pushed`));

        const { owner, repo } = GitHubProvider.parseRepoUrl(repoUrl);
        console.log(chalk.gray(`  \u2192 creating PR on ${owner}/${repo} (base: ${this.config.defaultBaseBranch})...`));

        const prUrl = await this.github.createPullRequest({
          owner,
          repo,
          title: plan.title,
          body: `## Summary\n${plan.description}\n\n## Changes\n${plan.subtasks.map((t) => `- ${t.title}`).join('\n')}`,
          head: branchName,
          base: this.config.defaultBaseBranch,
          draft: this.config.createDraftPr,
          issueNumber,
        });

        spinner.succeed(chalk.green('PR created'));
        console.log(chalk.green(`  \u2192 ${prUrl}`));
        return { success: true, prUrl, message: 'Feature implemented successfully!' };
      } catch (err) {
        spinner.fail('Failed to create PR');
        console.log(chalk.red(`  [debug] PR error: ${(err as Error).message}`));
        throw err;
      }
    } catch (err) {
      return { success: false, message: `Error: ${(err as Error).message}` };
    }
  }
}
