import { EventType, TaskEvent, AgentEvent, CollaborationEvent, SrubaEvent } from './types';
import { EventBus } from './events';

export class EventHandlers {
	constructor(private eventBus: EventBus) {}

	// Task event handlers
	private handleTaskEvent = async (event: TaskEvent): Promise<void> => {
		switch (event.type) {
			case EventType.TASK_CREATED:
			case EventType.TASK_COMPLETED:
			case EventType.TASK_FAILED:
				console.log(`Processing task event: ${event.type}`, event);
				break;
		}
	};

	// Agent event handlers
	private handleAgentEvent = async (event: AgentEvent): Promise<void> => {
		switch (event.type) {
			case EventType.AGENT_REGISTERED:
			case EventType.AGENT_STATUS_CHANGED:
				console.log(`Processing agent event: ${event.type}`, event);
				break;
		}
	};

	// Collaboration event handlers
	private handleCollaborationEvent = async (event: CollaborationEvent): Promise<void> => {
		switch (event.type) {
			case EventType.COLLABORATION_REQUESTED:
			case EventType.COLLABORATION_COMPLETED:
				console.log(`Processing collaboration event: ${event.type}`, event);
				break;
		}
	};

	// Register all handlers with type checking
	registerHandlers(): void {
		// Task events
		this.eventBus.subscribe((event: SrubaEvent): event is TaskEvent => 
			event.type === EventType.TASK_CREATED ||
			event.type === EventType.TASK_COMPLETED ||
			event.type === EventType.TASK_FAILED,
			this.handleTaskEvent
		);

		// Agent events
		this.eventBus.subscribe((event: SrubaEvent): event is AgentEvent =>
			event.type === EventType.AGENT_REGISTERED ||
			event.type === EventType.AGENT_STATUS_CHANGED,
			this.handleAgentEvent
		);

		// Collaboration events
		this.eventBus.subscribe((event: SrubaEvent): event is CollaborationEvent =>
			event.type === EventType.COLLABORATION_REQUESTED ||
			event.type === EventType.COLLABORATION_COMPLETED,
			this.handleCollaborationEvent
		);
	}
}