import { 
	SrubaEvent, 
	EventType, 
	TaskEvent, 
	AgentEvent, 
	CollaborationEvent 
} from '../types/event-types';
import { EventBus } from '../events';
import { ErrorLogger } from '../errors';
import path from 'path';
import fs from 'fs/promises';

interface EventMetrics {
	totalEvents: number;
	eventsByType: Map<EventType, number>;
	averageProcessingTime: number;
	errorRate: number;
}

export class EventMonitor {
	private logs: SrubaEvent[] = [];
	private metrics: EventMetrics = {
		totalEvents: 0,
		eventsByType: new Map(),
		averageProcessingTime: 0,
		errorRate: 0
	};
	private readonly maxLogs: number = 1000;

	constructor(
		private eventBus: EventBus,
		private errorLogger: ErrorLogger,
		private persistPath?: string
	) {
		this.setupSubscriptions();
		this.initialize();
	}

	async initialize(): Promise<void> {
		if (this.persistPath) {
			await fs.mkdir(this.persistPath, { recursive: true });
			// Load previous metrics if they exist
			try {
				const metricsPath = path.join(this.persistPath, 'metrics.json');
				const data = await fs.readFile(metricsPath, 'utf-8');
				const loadedMetrics = JSON.parse(data);
				this.metrics = {
					...loadedMetrics,
					eventsByType: new Map(Object.entries(loadedMetrics.eventsByType))
				};
			} catch (error) {
				// No previous metrics exist, continue with defaults
			}
		}
	}

	private setupSubscriptions(): void {
		// Monitor all events
		this.eventBus.subscribe(
			(event: SrubaEvent): event is SrubaEvent => true,
			this.handleEvent
		);
	}

	private handleEvent = async (event: SrubaEvent): Promise<void> => {
		const startTime = Date.now();
		try {
			// Log event
			this.logs.push(event);
			if (this.logs.length > this.maxLogs) {
				this.logs.shift();
			}

			// Update metrics
			this.updateMetrics(event, startTime);

			// Handle specific event types
			await this.handleSpecificEvent(event);
		} catch (error) {
			await this.errorLogger.logError(error as Error);
			this.metrics.errorRate = this.calculateErrorRate();
		}
	};

	private async handleSpecificEvent(event: SrubaEvent): Promise<void> {
		switch (event.type) {
			case EventType.TASK_FAILED:
				await this.handleTaskFailure(event as TaskEvent);
				break;
			case EventType.AGENT_STATUS_CHANGED:
				await this.handleAgentStatusChange(event as AgentEvent);
				break;
			// Add other specific handlers
		}
	}

	// Metrics methods
	getMetrics(): EventMetrics {
		return { ...this.metrics };
	}

	getRecentLogs(count: number = 100): SrubaEvent[] {
		return this.logs.slice(-count);
	}

	getLogsByType(type: EventType): SrubaEvent[] {
		return this.logs.filter(event => event.type === type);
	}

	private updateMetrics(event: SrubaEvent, startTime: number): void {
		this.metrics.totalEvents++;
		this.metrics.eventsByType.set(
			event.type,
			(this.metrics.eventsByType.get(event.type) || 0) + 1
		);
		this.metrics.averageProcessingTime = this.calculateAverageProcessingTime(startTime);
	}

	private calculateErrorRate(): number {
		const errorEvents = this.logs.filter(
			event => event.type === EventType.ERROR_OCCURRED
		).length;
		return errorEvents / this.metrics.totalEvents;
	}

	private calculateAverageProcessingTime(startTime: number): number {
		const processingTime = Date.now() - startTime;
		return (this.metrics.averageProcessingTime * (this.metrics.totalEvents - 1) + processingTime) 
			/ this.metrics.totalEvents;
	}

	private async handleTaskFailure(event: TaskEvent): Promise<void> {
		const { task, metadata } = event;
		await this.errorLogger.logError(new Error(`Task failed: ${task.id}`), {
			taskId: task.id,
			failureReason: metadata?.error,
			agentId: event.agentId
		});
		await this.persistMetrics();
	}

	private async handleAgentStatusChange(event: AgentEvent): Promise<void> {
		if (event.role) {
			const agentMetrics = {
				id: event.agentId,
				role: event.role,
				timestamp: event.timestamp,
				eventCount: this.metrics.eventsByType.get(event.type) || 0
			};
			await this.persistAgentMetrics(agentMetrics);
		}
	}

	private async persistMetrics(): Promise<void> {
		if (!this.persistPath) return;

		const metricsPath = path.join(this.persistPath, 'metrics.json');
		const metricsData = {
			...this.metrics,
			eventsByType: Object.fromEntries(this.metrics.eventsByType),
			timestamp: Date.now()
		};

		await fs.writeFile(
			metricsPath,
			JSON.stringify(metricsData, null, 2),
			'utf-8'
		);
	}

	private async persistAgentMetrics(agentMetrics: any): Promise<void> {
		if (!this.persistPath) return;

		const agentMetricsPath = path.join(
			this.persistPath,
			`agent_${agentMetrics.id}.json`
		);
		await fs.writeFile(
			agentMetricsPath,
			JSON.stringify(agentMetrics, null, 2),
			'utf-8'
		);
	}
}