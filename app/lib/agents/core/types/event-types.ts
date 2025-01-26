import { AgentRole, AgentTask, AgentContext } from './base-types';

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
	COLLABORATION_FAILED = 'collaboration_failed',
	
	// System Events
	STATE_CHANGED = 'state_changed',
	ERROR_OCCURRED = 'error_occurred',
	SYSTEM_READY = 'system_ready',
	SYSTEM_SHUTDOWN = 'system_shutdown'
}

export interface BaseEvent {
	id: string;
	type: EventType;
	timestamp: number;
	source: string;
	metadata?: Record<string, unknown>;
}

export interface TaskEvent extends BaseEvent {
	type: Extract<EventType, 
		| EventType.TASK_CREATED 
		| EventType.TASK_STARTED 
		| EventType.TASK_COMPLETED 
		| EventType.TASK_FAILED
	>;
	task: AgentTask;
	agentId?: string;
}

export interface AgentEvent extends BaseEvent {
	type: Extract<EventType, 
		| EventType.AGENT_REGISTERED 
		| EventType.AGENT_UNREGISTERED 
		| EventType.AGENT_STATUS_CHANGED
	>;
	agentId: string;
	role: AgentRole;
}

export interface CollaborationEvent extends BaseEvent {
	type: Extract<EventType, 
		| EventType.COLLABORATION_REQUESTED 
		| EventType.COLLABORATION_ACCEPTED 
		| EventType.COLLABORATION_COMPLETED 
		| EventType.COLLABORATION_FAILED
	>;
	requesterId: string;
	targetRole: AgentRole;
	context: AgentContext;
}

export interface StateChangeEvent extends BaseEvent {
	type: EventType.STATE_CHANGED;
	entityId: string;
	entityType: 'agent' | 'task' | 'system';
	previousState: unknown;
	newState: unknown;
}

export interface ErrorEvent extends BaseEvent {
	type: EventType.ERROR_OCCURRED;
	error: Error;
	context: unknown;
	severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemEvent extends BaseEvent {
	type: Extract<EventType, 
		| EventType.SYSTEM_READY 
		| EventType.SYSTEM_SHUTDOWN
	>;
	status: 'initializing' | 'ready' | 'shutting_down' | 'error';
	activeAgents?: number;
	pendingTasks?: number;
}

export type SrubaEvent = 
	| TaskEvent 
	| AgentEvent 
	| CollaborationEvent 
	| StateChangeEvent 
	| ErrorEvent
	| SystemEvent;

export type EventHandler = (event: SrubaEvent) => Promise<void>;
export type EventFilter = (event: SrubaEvent) => boolean;

// Re-export base types used in events
export { AgentRole, AgentTask, AgentContext };