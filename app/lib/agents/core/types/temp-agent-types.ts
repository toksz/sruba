// Base Agent Types
export type AgentId = string;
export type TaskId = string;

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

// Agent Context and Tasks
export interface AgentContext {
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

export interface AgentTask {
	id: string;
	role: AgentRole;
	type: string;
	priority: number;
	description: string;
	context: Record<string, unknown>;
	dependencies: string[];
	status: 'pending' | 'in_progress' | 'completed' | 'failed';
	assignedAgent?: string;
}

// Agent State and Memory
export interface AgentState {
	readonly id: AgentId;
	readonly type: AgentRole;
	readonly status: AgentStatus;
	readonly context: AgentContext;
	readonly memory: AgentMemory;
}

export interface AgentMemory {
	shortTerm: MemoryItem[];
	longTerm: Map<string, MemoryItem>;
	capacity: number;
}

export interface MemoryItem {
	id: string;
	timestamp: number;
	type: string;
	data: unknown;
}