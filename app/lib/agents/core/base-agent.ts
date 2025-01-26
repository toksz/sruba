import { 
  AgentRole, 
  AgentCapability, 
  AgentTask, 
  AgentContext,
  EventType,
  TaskEvent,
  AgentEvent,
  CollaborationEvent,
  StateChangeEvent
} from './types';
import { EventBus } from './events';

// Helper function for generating UUIDs
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export abstract class BaseAgent {
  protected id: string;
  protected role: AgentRole;
  protected capabilities: AgentCapability[];
  protected context: AgentContext;
  protected currentTask?: AgentTask;
  protected isAvailable: boolean = true;
  protected eventBus?: EventBus;

  constructor(
    id: string,
    role: AgentRole,
    capabilities: AgentCapability[],
    initialContext: AgentContext
  ) {
    this.id = id;
    this.role = role;
    this.capabilities = capabilities;
    this.context = initialContext;
  }

  setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  protected async emitEvent(event: TaskEvent | CollaborationEvent | StateChangeEvent): Promise<void> {
    if (this.eventBus) {
      await this.eventBus.publish(event);
    }
  }

  // Core methods all agents must implement
  abstract analyzeTask(task: AgentTask): Promise<boolean>;
  abstract executeTask(task: AgentTask): Promise<unknown>;
  abstract reviewOutput(output: unknown): Promise<boolean>;

  // Shared utility methods
  async assignTask(task: AgentTask): Promise<boolean> {
    if (!this.isAvailable) return false;
    
    const canHandle = await this.analyzeTask(task);
    if (!canHandle) return false;

    this.isAvailable = false;
    this.currentTask = task;
    
    const taskStartedEvent: TaskEvent = {
      id: generateUUID(),
      type: EventType.TASK_STARTED,
      timestamp: Date.now(),
      source: this.id,
      task,
      agentId: this.id
    };
    await this.emitEvent(taskStartedEvent);

    try {
      const output = await this.executeTask(task);
      const isValid = await this.reviewOutput(output);
      
      if (isValid) {
        const taskCompletedEvent: TaskEvent = {
          id: generateUUID(),
          type: EventType.TASK_COMPLETED,
          timestamp: Date.now(),
          source: this.id,
          task: { ...task, status: 'completed' },
          agentId: this.id
        };
        await this.emitEvent(taskCompletedEvent);
      } else {
        const taskFailedEvent: TaskEvent = {
          id: generateUUID(),
          type: EventType.TASK_FAILED,
          timestamp: Date.now(),
          source: this.id,
          task: { ...task, status: 'failed' },
          agentId: this.id,
          metadata: { error: 'Output validation failed' }
        };
        await this.emitEvent(taskFailedEvent);
      }

      return isValid;
    } catch (error) {
      const taskFailedEvent: TaskEvent = {
        id: generateUUID(),
        type: EventType.TASK_FAILED,
        timestamp: Date.now(),
        source: this.id,
        task: { ...task, status: 'failed' },
        agentId: this.id,
        metadata: { error }
      };
      this.emit(EventType.TASK_FAILED, taskFailedEvent);
      return false;
    } finally {
      this.isAvailable = true;
      this.currentTask = undefined;
    }
  }

  // Context management
  updateContext(update: Partial<AgentContext>): void {
    const previousContext = { ...this.context };
    this.context = { ...this.context, ...update };
    
    const stateChangeEvent: StateChangeEvent = {
      id: generateUUID(),
      type: EventType.STATE_CHANGED,
      timestamp: Date.now(),
      source: this.id,
      entityId: this.id,
      entityType: 'agent',
      previousState: previousContext,
      newState: this.context
    };
    await this.emitEvent(stateChangeEvent);
  }

  // Capability checking
  hasCapability(role: AgentRole, minConfidence = 0.7): boolean {
    return this.capabilities.some(
      cap => cap.role === role && cap.confidence >= minConfidence
    );
  }

  // Status reporting
  getStatus(): {
    id: string;
    role: AgentRole;
    available: boolean;
    currentTask?: AgentTask;
  } {
    return {
      id: this.id,
      role: this.role,
      available: this.isAvailable,
      currentTask: this.currentTask
    };
  }

  // Collaboration methods
  async requestCollaboration(
    targetRole: AgentRole,
    data: unknown
  ): Promise<void> {
    const collaborationEvent: CollaborationEvent = {
      id: generateUUID(),
      type: EventType.COLLABORATION_REQUESTED,
      timestamp: Date.now(),
      source: this.id,
      requesterId: this.id,
      targetRole,
      context: this.context
    };
    await this.emitEvent(collaborationEvent);
  }

  // Cleanup method to handle agent shutdown
  async cleanup(): Promise<void> {
    await this.emitEvent({
      id: generateUUID(),
      type: EventType.STATE_CHANGED,
      timestamp: Date.now(),
      source: this.id,
      entityId: this.id,
      entityType: 'agent',
      previousState: this.context,
      newState: { ...this.context, state: 'cleaning_up' }
    });
    
    // Final cleanup event
    await this.emitEvent({
      id: generateUUID(),
      type: EventType.STATE_CHANGED,
      timestamp: Date.now(),
      source: this.id,
      entityId: this.id,
      entityType: 'agent',
      previousState: { ...this.context, state: 'cleaning_up' },
      newState: { ...this.context, state: 'cleaned_up' }
    });
  }
}
