import { AgentId, AgentRole, BaseContext, TaskId } from './base-types';
import { AgentContext, AgentTask } from './agent-types';

// Event Types
export enum EventType {
	// Task Events
	TASK_CREATED = 'task_created',
	TASK_STARTED = 'task_started',
	TASK_COMPLETED = 'task_completed',
	TASK_FAILED = 'task_failed',
	
	// Agent Events
	AGENT_REGISTERED = 'agent_registered',
	AGENT_UNREGISTERED = 'agent_unregistered',
	AGENT_STATUS_CHANGED = 'agent_status_changed',
	
	// Collaboration Events
	COLLABORATION_REQUESTED = 'collaboration_requested',
	COLLABORATION_ACCEPTED = 'collaboration_accepted',
	COLLABORATION_COMPLETED = 'collaboration_completed',
	COLLABORATION_FAILED = 'collaboration_failed'
}

// Base Event Interface
export interface BaseEvent extends BaseContext {
	id: string;
	type: EventType;
	source: AgentId;
}

// Task Events
export interface TaskEvent extends BaseEvent {
	type: Extract<EventType, 
		| EventType.TASK_CREATED 
		| EventType.TASK_STARTED 
		| EventType.TASK_COMPLETED 
		| EventType.TASK_FAILED
	>;
	task: AgentTask;
	agentId?: AgentId;
}

// Agent Events
export interface AgentEvent extends BaseEvent {
	type: Extract<EventType, 
		| EventType.AGENT_REGISTERED 
		| EventType.AGENT_UNREGISTERED 
		| EventType.AGENT_STATUS_CHANGED
	>;
	agentId: AgentId;
	role: AgentRole;
}

// Collaboration Events
export interface CollaborationEvent extends BaseEvent {
	type: Extract<EventType, 
		| EventType.COLLABORATION_REQUESTED 
		| EventType.COLLABORATION_ACCEPTED 
		| EventType.COLLABORATION_COMPLETED 
		| EventType.COLLABORATION_FAILED
	>;
	requesterId: AgentId;
	targetRole: AgentRole;
	context: AgentContext;
}

// Union type for all possible events
export type SrubaEvent = TaskEvent | AgentEvent | CollaborationEvent;

// Event handlers
export type EventHandler = (event: SrubaEvent) => Promise<void>;
export type EventFilter = (event: SrubaEvent) => boolean;