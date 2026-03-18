import { ModelRouter } from '../core/modelRouter';
import { Plan, SubTask } from '../types';

export class PlannerAgent {
  constructor(private router: ModelRouter) {}

  async createPlan(demand: string, repoPath: string): Promise<Plan> {
    const prompt = `Create an implementation plan for: ${demand}
Repo: ${repoPath}
Be concise. Return only JSON, no markdown:
{"title":"...","description":"...","subtasks":[{"id":"1","title":"...","description":"...","filesToModify":["path"],"acceptanceCriteria":["criteria"]}]}`;

    const response = await this.router.complete(prompt, 'planning', 1024, 0.7);
    return this.extractJson(response.response, demand);
  }

  private extractJson(text: string, demand: string): Plan {
    try {
      return JSON.parse(text) as Plan;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]) as Plan;
        } catch {}
      }
      return {
        title: 'Feature Implementation',
        description: demand,
        subtasks: [
          {
            id: '1',
            title: 'Implement feature',
            description: demand,
            filesToModify: [],
            acceptanceCriteria: [],
          } satisfies SubTask,
        ],
      };
    }
  }
}
