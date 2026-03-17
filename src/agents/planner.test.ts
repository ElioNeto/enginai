import { PlannerAgent } from './planner';
import { ModelRouter } from '../core/modelRouter';

jest.mock('../core/modelRouter');

const mockComplete = jest.fn();
(ModelRouter as jest.Mock).mockImplementation(() => ({ complete: mockComplete }));

describe('PlannerAgent', () => {
  let planner: PlannerAgent;

  beforeEach(() => {
    planner = new PlannerAgent(new (ModelRouter as any)({}));
    jest.clearAllMocks();
  });

  it('parses a valid JSON plan from LLM response', async () => {
    const plan = {
      title: 'Add health endpoint',
      description: 'Add GET /health',
      subtasks: [{ id: '1', title: 'Create route', description: 'Add route', filesToModify: ['src/routes/health.ts'], acceptanceCriteria: ['returns 200'] }],
    };
    mockComplete.mockResolvedValue({ response: JSON.stringify(plan), model: 'gemini', provider: 'gemini' });
    const result = await planner.createPlan('add GET /health endpoint', '/repo');
    expect(result.title).toBe('Add health endpoint');
    expect(result.subtasks).toHaveLength(1);
  });

  it('returns a fallback plan when LLM response is not valid JSON', async () => {
    mockComplete.mockResolvedValue({ response: 'Some text without JSON', model: 'gemini', provider: 'gemini' });
    const result = await planner.createPlan('do something', '/repo');
    expect(result.title).toBe('Feature Implementation');
    expect(result.subtasks).toHaveLength(1);
  });
});
