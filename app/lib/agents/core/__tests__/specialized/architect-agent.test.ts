import { ArchitectAgent } from '../../specialized/architect-agent';
import { AgentContext, AgentTask } from '../../types/base-types';
import { EventBus } from '../../events';
import { ErrorLogger } from '../../errors';

describe('ArchitectAgent', () => {
	let agent: ArchitectAgent;
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
				techStack: ['typescript', 'node'],
				constraints: []
			},
			recentActions: [],
			sharedKnowledge: new Map()
		};

		agent = new ArchitectAgent('test-architect', initialContext);
		agent.setEventBus(eventBus);
	});

	describe('Task Analysis', () => {
		it('should accept architecture-related tasks', async () => {
			const task: AgentTask = {
				id: 'test-1',
				type: 'system_design',
				role: 'architect',
				priority: 1,
				description: 'Design system architecture',
				dependencies: [],
				status: 'pending',
				context: {}
			};

			const canHandle = await agent.analyzeTask(task);
			expect(canHandle).toBe(true);
		});

		it('should reject non-architecture tasks', async () => {
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
		it('should handle system design tasks', async () => {
			const task: AgentTask = {
				id: 'test-3',
				type: 'system_design',
				role: 'architect',
				priority: 1,
				description: 'Design system architecture',
				dependencies: [],
				status: 'pending',
				context: {}
			};

			const output = await agent.executeTask(task);
			expect(output).toBeTruthy();
			expect(output).toHaveProperty('decisions');
			expect(output).toHaveProperty('components');
		});
	});

	describe('Output Validation', () => {
		it('should validate architecture output', async () => {
			const output = {
				decisions: [{
					area: 'test',
					decision: 'test decision',
					rationale: 'test rationale',
					alternatives: ['alt1'],
					consequences: ['cons1']
				}],
				components: [{
					name: 'test-component',
					purpose: 'testing',
					dependencies: [],
					interfaces: ['test'],
					constraints: ['test']
				}]
			};

			const isValid = await agent.reviewOutput(output);
			expect(isValid).toBe(true);
		});

		it('should reject invalid output', async () => {
			const output = {
				decisions: [],
				components: []
			};

			const isValid = await agent.reviewOutput(output);
			expect(isValid).toBe(false);
		});
	});
});