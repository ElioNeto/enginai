import axios from 'axios';

export interface PullRequestOptions {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;
  base: string;
  draft?: boolean;
  issueNumber?: number;
}

export class GitHubProvider {
  private api = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  constructor(private token: string) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `token ${token}`;
    }
  }

  async getIssue(url: string): Promise<{ title: string; body: string; number: number }> {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (!match) {
      throw new Error(`Invalid GitHub issue URL: ${url}`);
    }
    const [, owner, repo, num] = match;

    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/issues/${num}`);
      return {
        title: response.data.title,
        body: response.data.body ?? '',
        number: parseInt(num, 10),
      };
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'GitHub authentication failed. Set GITHUB_TOKEN env var. ' +
          'Get a token at: https://github.com/settings/tokens (scopes: repo, workflow)'
        );
      }
      throw new Error(`Failed to fetch issue ${url}: ${(err as Error).message}`);
    }
  }

  async createPullRequest(opts: PullRequestOptions): Promise<string> {
    let body = opts.body;
    if (opts.issueNumber) {
      body += `\n\nCloses #${opts.issueNumber}`;
    }

    try {
      const response = await this.api.post(`/repos/${opts.owner}/${opts.repo}/pulls`, {
        title: opts.title,
        body,
        head: opts.head,
        base: opts.base,
        draft: opts.draft ?? false,
      });
      return response.data.html_url as string;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'GitHub authentication failed. Set GITHUB_TOKEN env var. ' +
          'Get a token at: https://github.com/settings/tokens (scopes: repo, workflow)'
        );
      }
      throw new Error(`Failed to create PR: ${(err as Error).message}`);
    }
  }

  static parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
    const cleaned = repoUrl.replace(/\.git$/, '');
    const parts = cleaned.split('/');
    return {
      owner: parts[parts.length - 2],
      repo: parts[parts.length - 1],
    };
  }
}
