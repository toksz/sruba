# Agent Patterns

## Base Agent
```typescript
class CustomAgent extends BaseAgent {
	constructor(id: string, type: AgentType) {
		super(id, type);
	}
	async handleEvent(event: AgentEvent): Promise<void> {
		try { /*...*/ } catch (error) { this.handleError(error); }
	}
}
```

## Event Handling
```typescript
eventBus.subscribe({ type: 'EVENT' }, 
	async (event) => { 
		try { /*...*/ } catch (error) { /*...*/ }
	}
);
```