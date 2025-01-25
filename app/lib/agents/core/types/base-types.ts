// Core type definitions
export type AgentId = string;
export type TaskId = string;

// Basic enums
export enum AgentRole {
	ARCHITECT = 'architect',
	CODER = 'coder',
	DESIGNER = 'designer',
	REVIEWER = 'reviewer',
	PROJECT_MANAGER = 'project_manager'
}

export enum AgentStatus {
	IDLE = 'idle',
	BUSY = 'busy',
	ERROR = 'error',
	OFFLINE = 'offline'
}

// Basic interfaces
export interface BaseContext {
	timestamp: number;
	metadata?: Record<string, unknown>;
}

export interface BaseTask {
	id: TaskId;
	type: string;
	status: TaskStatus;
	metadata?: Record<string, unknown>;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';