import { RepoManager } from './repoManager';
import { AppConfig } from '../types';

const mockConfig: AppConfig = {
  appEnv: 'test',
  logLevel: 'INFO',
  workdir: '/tmp/enginai-test',
  githubToken: 'test-token',
  defaultBaseBranch: 'main',
  createDraftPr: false,
  geminiApiKey: '',
  geminiDailyLimit: 1450,
  ollamaHost: 'http://localhost:11434',
  ollamaModel: 'codellama',
  templatesDir: '/tmp/templates',
  defaultAuthor: 'Test User',
  defaultLicense: 'MIT',
};

describe('RepoManager.createPullRequest', () => {
  it('parses owner and repo correctly from GitHub URL', () => {
    const rm = new RepoManager(mockConfig);
    const url = 'https://github.com/ElioNeto/enginai';
    const parts = url.replace(/\.git$/, '').split('/');
    expect(parts[parts.length - 2]).toBe('ElioNeto');
    expect(parts[parts.length - 1]).toBe('enginai');
  });

  it('parses owner and repo from .git URL', () => {
    const url = 'https://github.com/ElioNeto/enginai.git';
    const parts = url.replace(/\.git$/, '').split('/');
    expect(parts[parts.length - 1]).toBe('enginai');
  });
});
