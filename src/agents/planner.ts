import { ModelRouter } from '../core/modelRouter';
import { Plan, SubTask } from '../types';

export class PlannerAgent {
  constructor(private router: ModelRouter) {}

  async createPlan(demand: string, repoPath: string): Promise<Plan> {
    const prompt = `
You are a senior software engineer. Analyze the following demand and create a structured implementation plan.

Demand: ${demand}
Repository path: ${repoPath}

Respond with a JSON object (no markdown) in this exact format:
{
  "title": "short feature title",
  "description": "what will be implemented",
  "subtasks": [
    {
      "id": "1",
      "title": "subtask title",
      "description": "what to do",
      "filesToModify": ["src/routes/health.ts"],
      "acceptanceCriteria": ["endpoint returns 200"]
    }
  ]
}
`;

    const response = await this.router.complete(prompt, 'planning', 2048, 0.7);
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
      // Fallback plan
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
