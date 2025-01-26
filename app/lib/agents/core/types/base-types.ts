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

// Agent capabilities
export interface AgentCapability {
	role: AgentRole;
	confidence: number;
	specialties: string[];
}

// Basic interfaces
export interface BaseContext {
	timestamp: number;
	metadata?: Record<string, unknown>;
}

export interface AgentTask {
	id: TaskId;
	role: AgentRole;
	type: string;
	priority: number;
	description: string;
	context: Record<string, unknown>;
	dependencies: TaskId[];
	status: 'pending' | 'in_progress' | 'completed' | 'failed';
	assignedAgent?: AgentId;
}

export interface AgentContext extends BaseContext {
	projectInfo: {
		name: string;
		description: string;
		techStack: string[];
		constraints: string[];
	};
	currentTask?: AgentTask;
	recentActions: Array<{
		timestamp: number;
		action: string;
		result: unknown;
	}>;
	sharedKnowledge: Map<string, unknown>;
}