import { ReviewerAgent } from '../../specialized/reviewer-agent';
import { AgentContext, AgentTask } from '../../types/base-types';
import { EventBus } from '../../events';
import { ErrorLogger } from '../../errors';

describe('ReviewerAgent', () => {
	let agent: ReviewerAgent;
	let eventBus: EventBus;
	let errorLogger: ErrorLogger;

	beforeEach(async () => {
		errorLogger = new ErrorLogger();
		eventBus = new EventBus(errorLogger, 'test-events');
		await eventBus.initialize();

		const initialContext: AgentContext = {
			projectInfo: {
				name: 'test-project',
				description: 'Test project',
				techStack: ['typescript', 'react'],
				constraints: []
			},
			recentActions: [],
			sharedKnowledge: new Map()
		};

		agent = new ReviewerAgent('test-reviewer', initialContext);
		agent.setEventBus(eventBus);
	});

	describe('Task Analysis', () => {
		it('should accept review tasks', async () => {
			const task: AgentTask = {
				id: 'test-1',
				type: 'code_review',
				role: 'reviewer',
				priority: 1,
				description: 'Review code changes',
				dependencies: [],
				status: 'pending',
				context: {}
			};

			const canHandle = await agent.analyzeTask(task);
			expect(canHandle).toBe(true);
		});

		it('should reject non-review tasks', async () => {
			const task: AgentTask = {
				id: 'test-2',
				type: 'implementation',
				role: 'coder',
				priority: 1,
				description: 'Implement feature',
				dependencies: [],
				status: 'pending',
				context: {}
			};

			const canHandle = await agent.analyzeTask(task);
			expect(canHandle).toBe(false);
		});
	});

	describe('Task Execution', () => {
		it('should handle code review tasks', async () => {
			const task: AgentTask = {
				id: 'test-3',
				type: 'code_review',
				role: 'reviewer',
				priority: 1,
				description: 'Review code changes',
				dependencies: [],
				status: 'pending',
				context: {
					component: 'TestComponent'
				}
			};

			const output = await agent.executeTask(task);
			expect(output).toBeTruthy();
			expect(output).toHaveProperty('status');
			expect(output).toHaveProperty('comments');
			expect(output).toHaveProperty('metrics');
		});
	});

	describe('Output Validation', () => {
		it('should validate review output', async () => {
			const output = {
				status: 'changes_requested',
				comments: [{
					file: 'src/components/TestComponent.tsx',
					line: 1,
					severity: 'warning',
					message: 'Consider adding documentation',
					suggestion: 'Add JSDoc comments'
				}],
				metrics: {
					quality: 0.8,
					coverage: 0.9,
					complexity: 5,
					maintainability: 0.85
				},
				recommendations: [
					'Improve documentation',
					'Add more test cases'
				]
			};

			const isValid = await agent.reviewOutput(output);
			expect(isValid).toBe(true);
		});

		it('should reject invalid review output', async () => {
			const output = {
				status: 'invalid_status',
				comments: []
			};

			const isValid = await agent.reviewOutput(output);
			expect(isValid).toBe(false);
		});
	});
});