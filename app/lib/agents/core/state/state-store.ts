import { AgentState } from '../types/agent-types';
import { AgentId, AgentRole, AgentStatus } from '../types/base-types';



export class StateStore {
	private states: Map<AgentId, AgentState> = new Map();
	private stateChangeListeners: Set<(state: AgentState) => void> = new Set();

	getState(id: AgentId): AgentState | undefined {
		return this.states.get(id);
	}

	setState(id: AgentId, state: AgentState): void {
		this.validateState(state);
		const oldState = this.states.get(id);
		this.states.set(id, state);
		
		// Notify listeners of state change
		if (oldState) {
			this.stateChangeListeners.forEach(listener => listener(state));
		}
	}

	updateState(id: AgentId, update: Partial<AgentState>): AgentState | undefined {
		const currentState = this.states.get(id);
		if (!currentState) return undefined;

		const newState = { ...currentState, ...update };
		this.validateState(newState);
		this.states.set(id, newState);
		
		// Notify listeners of state change
		this.stateChangeListeners.forEach(listener => listener(newState));
		return newState;
	}

	removeState(id: AgentId): boolean {
		return this.states.delete(id);
	}

	getAllStates(): AgentState[] {
		return Array.from(this.states.values());
	}

	getStatesByType(type: AgentRole): AgentState[] {
		return this.getAllStates().filter(state => state.type === type);
	}

	getStatesByStatus(status: AgentStatus): AgentState[] {
		return this.getAllStates().filter(state => state.status === status);
	}

	onStateChange(listener: (state: AgentState) => void): () => void {
		this.stateChangeListeners.add(listener);
		return () => this.stateChangeListeners.delete(listener);
	}

	private validateState(state: AgentState): void {
		if (!state.id || !state.type || !state.status) {
			throw new Error('Invalid state: missing required fields');
		}

		if (!Object.keys(AgentRole).includes(state.type)) {
			throw new Error(`Invalid agent type: ${state.type}`);
		}

		if (!Object.keys(AgentStatus).includes(state.status)) {
			throw new Error(`Invalid agent status: ${state.status}`);
		}

		if (!state.context || !state.memory) {
			throw new Error('Invalid state: missing context or memory');
		}
	}
}