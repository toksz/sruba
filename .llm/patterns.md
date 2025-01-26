# Common Code Patterns

## 1. Agent Implementation

### Base Agent Pattern
```typescript
class CustomAgent extends BaseAgent {
  constructor(id: string, type: AgentType) {
    super(id, type);
  }

  async handleEvent(event: AgentEvent): Promise<void> {
    try {
      // Event handling logic
    } catch (error) {
      this.handleError(error);
    }
  }

  async processTask(task: Task): Promise<TaskResult> {
    try {
      // Task processing logic
    } catch (error) {
      return this.handleTaskError(error);
    }
  }
}
```

## 2. Error Handling

### Error Recovery Pattern
```typescript
class ErrorRecoveryStrategy implements RecoveryStrategy {
  canHandle(error: AgentError): boolean {
    // Check if this strategy can handle the error
    return error.type === ErrorType.SPECIFIC_ERROR;
  }

  async handle(error: AgentError): Promise<void> {
    // 1. Log error
    ErrorLogger.log(error);
    
    // 2. Break down complex error
    const simpleErrors = this.decomposeError(error);
    
    // 3. Apply fixes
    for (const simpleError of simpleErrors) {
      await this.applyFix(simpleError);
    }
    
    // 4. Verify fix
    await this.verifyFix(error);
  }
}
```

## 3. Event Handling

### Event Subscription Pattern
```typescript
class EventHandler {
  constructor(private eventBus: EventBus) {
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    this.eventBus.subscribe(
      { type: 'SPECIFIC_EVENT' },
      async (event) => {
        try {
          await this.handleSpecificEvent(event);
        } catch (error) {
          await this.handleEventError(error);
        }
      }
    );
  }
}
```

## 4. State Management

### Immutable State Update Pattern
```typescript
class StateManager {
  private state: AgentState;

  updateState(update: Partial<AgentState>): void {
    // 1. Create new state
    const newState = {
      ...this.state,
      ...update,
      timestamp: Date.now()
    };

    // 2. Validate state
    this.validateState(newState);

    // 3. Update state
    this.state = newState;

    // 4. Emit state change event
    this.emitStateChange(newState);
  }
}
```

## 5. Testing

### Unit Test Pattern
```typescript
describe('AgentComponent', () => {
  let component: AgentComponent;
  let dependencies: MockDependencies;

  beforeEach(() => {
    dependencies = createMockDependencies();
    component = new AgentComponent(dependencies);
  });

  it('should handle specific scenario', async () => {
    // 1. Arrange
    const input = createTestInput();
    
    // 2. Act
    const result = await component.process(input);
    
    // 3. Assert
    expect(result).toMatchExpectedOutput();
  });

  it('should handle errors appropriately', async () => {
    // 1. Arrange
    const errorCase = createErrorCase();
    
    // 2. Act & Assert
    await expect(component.process(errorCase))
      .rejects
      .toThrow(ExpectedError);
  });
});
```

## 6. Documentation

### Component Documentation Pattern
```typescript
/**
 * @component ComponentName
 * @description Brief description of the component's purpose
 *
 * @example
 * ```typescript
 * const component = new ComponentName(dependencies);
 * await component.doSomething();
 * ```
 *
 * @error-handling
 * - ErrorType.SPECIFIC: Handled by retrying the operation
 * - ErrorType.CRITICAL: Escalated to error monitoring
 *
 * @dependencies
 * - DependencyA: Used for specific functionality
 * - DependencyB: Required for certain operations
 *
 * @changelog
 * - v1.0.0: Initial implementation
 * - v1.1.0: Added error handling
 */
```
