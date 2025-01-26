import { AgentId, AgentRole, AgentStatus, BaseContext, BaseTask, TaskId } from './base-types';

// Agent Context
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

// Agent Task
export interface AgentTask extends BaseTask {
	role: AgentRole;
	priority: number;
	description: string;
	context: Record<string, unknown>;
	dependencies: TaskId[];
	assignedAgent?: AgentId;
}

// Agent Memory
export interface AgentMemory {
	shortTerm: MemoryItem[];
	longTerm: Map<string, MemoryItem>;
	capacity: number;
}

export interface MemoryItem extends BaseContext {
	id: string;
	type: string;
	data: unknown;
}

// Agent State
export interface AgentState {
	readonly id: AgentId;
	readonly type: AgentRole;
	readonly status: AgentStatus;
	readonly context: AgentContext;
	readonly memory: AgentMemory;
}


