import { AgentContext } from '../types/agent-types';

export class ContextManager {
	private contextStore: Map<string, AgentContext> = new Map();
	private sharedContext: Map<string, unknown> = new Map();

	storeContext(id: string, context: AgentContext): void {
		this.contextStore.set(id, context);
	}

	getContext(id: string): AgentContext | undefined {
		return this.contextStore.get(id);
	}

	updateContext(id: string, update: Partial<AgentContext>): AgentContext | undefined {
		const current = this.contextStore.get(id);
		if (!current) return undefined;

		const updated = { ...current, ...update };
		this.contextStore.set(id, updated);
		return updated;
	}

	setSharedContext(key: string, value: unknown): void {
		this.sharedContext.set(key, value);
	}

	getSharedContext(key: string): unknown | undefined {
		return this.sharedContext.get(key);
	}

	mergeContexts(contexts: AgentContext[]): AgentContext {
		return contexts.reduce((merged, current) => ({
			...merged,
			projectInfo: { ...merged.projectInfo, ...current.projectInfo },
			recentActions: [...merged.recentActions, ...current.recentActions],
			sharedKnowledge: new Map([...merged.sharedKnowledge, ...current.sharedKnowledge])
		}));
	}

	clearContext(id: string): boolean {
		return this.contextStore.delete(id);
	}
}