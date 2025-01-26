import { DesignerAgent } from '../../specialized/designer-agent';
import { AgentContext, AgentTask } from '../../types/base-types';
import { EventBus } from '../../events';
import { ErrorLogger } from '../../errors';

describe('DesignerAgent', () => {
	let agent: DesignerAgent;
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
				techStack: ['react', 'typescript'],
				constraints: []
			},
			recentActions: [],
			sharedKnowledge: new Map()
		};

		agent = new DesignerAgent('test-designer', initialContext);
		agent.setEventBus(eventBus);
	});

	describe('Task Analysis', () => {
		it('should accept design-related tasks', async () => {
			const task: AgentTask = {
				id: 'test-1',
				type: 'component_design',
				role: 'designer',
				priority: 1,
				description: 'Design UI component',
				dependencies: [],
				status: 'pending',
				context: {}
			};

			const canHandle = await agent.analyzeTask(task);
			expect(canHandle).toBe(true);
		});

		it('should reject non-design tasks', async () => {
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
		it('should handle component design tasks', async () => {
			const task: AgentTask = {
				id: 'test-3',
				type: 'component_design',
				role: 'designer',
				priority: 1,
				description: 'Design UI component',
				dependencies: [],
				status: 'pending',
				context: {}
			};

			const output = await agent.executeTask(task);
			expect(output).toBeTruthy();
			expect(output).toHaveProperty('components');
			expect(Array.isArray(output.components)).toBe(true);
		});
	});

	describe('Output Validation', () => {
		it('should validate component specifications', async () => {
			const output = {
				components: [{
					name: 'TestComponent',
					layout: 'flex',
					styles: {
						colors: ['#primary'],
						spacing: { padding: '1rem' },
						typography: { fontSize: '16px' }
					},
					accessibility: {
						ariaLabels: { button: 'Test Button' },
						roles: { main: 'button' },
						compliance: ['WCAG2.1']
					},
					interactions: {
						events: ['click'],
						animations: ['fade'],
						states: ['hover', 'active']
					}
				}]
			};

			const isValid = await agent.reviewOutput(output);
			expect(isValid).toBe(true);
		});

		it('should reject invalid specifications', async () => {
			const output = {
				components: [{
					name: 'TestComponent'
					// Missing required fields
				}]
			};

			const isValid = await agent.reviewOutput(output);
			expect(isValid).toBe(false);
		});
	});
});