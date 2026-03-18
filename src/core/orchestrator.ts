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
      plan.subtasks.forEach((t, i) => console.log(`  ${i + 1}. ${t.title}`));

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

      // 5. Tests
      spinner = ora('Generating tests...').start();
      try {
        const testFiles = await this.tester.generateTests(changes, repoPath);
        spinner.succeed(chalk.green(`${testFiles.length} test files created`));
      } catch (err) {
        spinner.warn('Test generation failed, continuing...');
      }

      // 6. Commit + Push + PR
      spinner = ora('Creating branch and PR...').start();
      try {
        const branchName = `feature/${plan.title.toLowerCase().replace(/\s+/g, '-').substring(0, 50)}`;
        await this.repoManager.createBranch(repoPath, branchName);
        await this.repoManager.commit(repoPath, `feat: ${plan.title}`);

        // Push branch to remote so GitHub API can find it
        await this.repoManager.pushBranch(repoPath, repoUrl, branchName);

        const { owner, repo } = GitHubProvider.parseRepoUrl(repoUrl);
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
        return { success: true, prUrl, message: 'Feature implemented successfully!' };
      } catch (err) {
        spinner.fail('Failed to create PR');
        throw err;
      }
    } catch (err) {
      return { success: false, message: `Error: ${(err as Error).message}` };
    }
  }
}
