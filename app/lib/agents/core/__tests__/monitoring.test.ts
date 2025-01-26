import { 
	EventType,
	TaskEvent,
	AgentEvent
} from '../types/event-types';
import { EventMonitor } from '../monitoring';
import { EventBus } from '../events';
import { ErrorLogger } from '../errors';
import path from 'path';
import fs from 'fs/promises';

describe('Event Monitoring System', () => {
	let monitor: EventMonitor;
	let eventBus: EventBus;
	let errorLogger: ErrorLogger;
	const testStorePath = path.join(__dirname, 'test-monitoring');

	beforeEach(async () => {
		errorLogger = new ErrorLogger();
		eventBus = new EventBus(errorLogger, path.join(testStorePath, 'events'));
		await eventBus.initialize();
		monitor = new EventMonitor(eventBus, errorLogger, path.join(testStorePath, 'metrics'));
		await monitor.initialize();
	});

	afterEach(async () => {
		await fs.rm(testStorePath, { recursive: true, force: true });
	});

	it('should track event metrics', async () => {
		const taskEvent: TaskEvent = {
			id: 'test-1',
			type: EventType.TASK_STARTED,
			timestamp: Date.now(),
			source: 'test',
			task: {
				id: 'task-1',
				type: 'test',
				status: 'pending',
				role: 'tester',
				priority: 1,
				description: 'test task',
				context: {},
				dependencies: []
			},
			agentId: 'agent-1'
		};

		await eventBus.publish(taskEvent);
		const metrics = monitor.getMetrics();
		
		expect(metrics.totalEvents).toBe(1);
		expect(metrics.eventsByType.get(EventType.TASK_STARTED)).toBe(1);
		expect(metrics.errorRate).toBe(0);
	});

	it('should persist metrics', async () => {
		const agentEvent: AgentEvent = {
			id: 'test-2',
			type: EventType.AGENT_REGISTERED,
			timestamp: Date.now(),
			source: 'test',
			agentId: 'agent-1',
			role: 'tester'
		};

		await eventBus.publish(agentEvent);
		
		const metricsPath = path.join(testStorePath, 'metrics', 'metrics.json');
		const metricsData = JSON.parse(await fs.readFile(metricsPath, 'utf-8'));
		
		expect(metricsData.totalEvents).toBe(1);
		expect(metricsData.eventsByType[EventType.AGENT_REGISTERED]).toBe(1);
	});
});