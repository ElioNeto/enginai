import * as path from 'path';
import * as fs from 'fs';
import simpleGit, { SimpleGit } from 'simple-git';
import axios from 'axios';
import { AppConfig } from '../types';

interface PullRequestOptions {
  repoUrl: string;
  title: string;
  body: string;
  branch: string;
}

export class RepoManager {
  constructor(private config: AppConfig) {}

  async cloneRepo(repoUrl: string, branch?: string): Promise<string> {
    const targetPath = path.join(this.config.workdir, 'repo');
    fs.mkdirSync(targetPath, { recursive: true });
    const git = simpleGit();
    const cloneOptions = branch ? ['--branch', branch] : [];
    await git.clone(repoUrl, targetPath, cloneOptions);
    return targetPath;
  }

  async initRepo(repoPath: string): Promise<void> {
    const git = simpleGit(repoPath);
    await git.init();
    await git.addConfig('user.name', this.config.defaultAuthor);
    await git.addConfig('user.email', 'enginai@local');
  }

  async createBranch(repoPath: string, branchName: string): Promise<void> {
    const git: SimpleGit = simpleGit(repoPath);
    await git.checkoutLocalBranch(branchName);
  }

  async commit(repoPath: string, message: string): Promise<void> {
    const git: SimpleGit = simpleGit(repoPath);
    await git.add('.');
    await git.commit(message, ['--allow-empty']);
  }

  async pushBranch(repoPath: string, repoUrl: string, branchName: string): Promise<void> {
    const git: SimpleGit = simpleGit(repoPath);
    // Inject token into remote URL for authenticated push
    const authedUrl = repoUrl.replace(
      'https://',
      `https://${this.config.githubToken}@`,
    );
    await git.remote(['set-url', 'origin', authedUrl]);
    await git.push('origin', branchName, ['--set-upstream']);
  }

  async createPullRequest(opts: PullRequestOptions): Promise<string | null> {
    const parts = opts.repoUrl.replace(/\.git$/, '').split('/');
    const owner = parts[parts.length - 2];
    const repo = parts[parts.length - 1];

    try {
      const response = await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        {
          title: opts.title,
          body: opts.body,
          head: opts.branch,
          base: this.config.defaultBaseBranch,
          draft: this.config.createDraftPr,
        },
        {
          headers: {
            Authorization: `token ${this.config.githubToken}`,
            Accept: 'application/vnd.github+json',
          },
        },
      );
      return response.data.html_url as string;
    } catch (err) {
      console.error(`Failed to create PR: ${(err as Error).message}`);
      return null;
    }
  }
}
