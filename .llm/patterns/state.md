# State Patterns

## Immutable State Update
```typescript
updateState(update: Partial<AgentState>): void {
	const newState = { ...this.state, ...update };
	this.validateState(newState);
	this.state = newState;
	this.emitStateChange(newState);
}
```

## State Validation
```typescript
validateState(state: AgentState): void {
	if (!state.id || !state.type) throw new Error('Invalid state');
	if (!Object.keys(AgentRole).includes(state.type)) {
		throw new Error(`Invalid type: ${state.type}`);
	}
}
```