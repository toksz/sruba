import { 
	AgentId, 
	AgentRole, 
	AgentStatus, 
	AgentTask, 
	AgentContext, 
	AgentCapability 
} from './base-types';

// Agent Memory types
export interface MemoryItem {
	id: string;
	timestamp: number;
	type: string;
	data: unknown;
}

export interface AgentMemory {
	shortTerm: MemoryItem[];
	longTerm: Map<string, MemoryItem>;
	capacity: number;
}

// Agent State
export interface AgentState {
	readonly id: AgentId;
	readonly type: AgentRole;
	readonly status: AgentStatus;
	readonly context: AgentContext;
	readonly memory: AgentMemory;
}

// Re-export base types
export type { 
	AgentId,
	AgentRole,
	AgentStatus,
	AgentTask,
	AgentContext,
	AgentCapability
};


