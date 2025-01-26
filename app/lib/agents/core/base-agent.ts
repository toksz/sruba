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
} from './types/event-types';
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
  protected taskQueue: AgentTask[] = [];
  protected collaborators: Map<AgentRole, string[]> = new Map();
  protected taskHistory: AgentTask[] = [];
  protected maxConcurrentTasks: number = 1;

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
        await this.emitEvent(taskFailedEvent);
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
  // Enhanced task management
  async queueTask(task: AgentTask): Promise<void> {
    this.taskQueue.push(task);
    await this.processTaskQueue();
  }

  protected async processTaskQueue(): Promise<void> {
    if (!this.isAvailable || this.taskQueue.length === 0) return;

    const task = this.taskQueue[0];
    const success = await this.assignTask(task);
    
    if (success) {
      this.taskHistory.push({ ...task, status: 'completed' });
    } else {
      this.taskHistory.push({ ...task, status: 'failed' });
    }
    
    this.taskQueue.shift();
  }

  // Enhanced collaboration
  async registerCollaborator(role: AgentRole, agentId: string): Promise<void> {
    if (!this.collaborators.has(role)) {
      this.collaborators.set(role, []);
    }
    this.collaborators.get(role)?.push(agentId);
    
    await this.emitEvent({
      id: generateUUID(),
      type: EventType.COLLABORATION_ACCEPTED,
      timestamp: Date.now(),
      source: this.id,
      requesterId: agentId,
      targetRole: this.role,
      context: this.context
    });
  }

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

  protected async delegateSubtask(subtask: AgentTask, targetRole: AgentRole): Promise<void> {
    await this.requestCollaboration(targetRole, {
      parentTask: this.currentTask,
      subtask
    });
  }

  // Performance monitoring
  getPerformanceMetrics(): {
    completedTasks: number;
    failedTasks: number;
    averageTaskTime: number;
    collaborationCount: number;
  } {
    const completed = this.taskHistory.filter(t => t.status === 'completed').length;
    const failed = this.taskHistory.filter(t => t.status === 'failed').length;
    
    return {
      completedTasks: completed,
      failedTasks: failed,
      averageTaskTime: this.calculateAverageTaskTime(),
      collaborationCount: Array.from(this.collaborators.values())
        .reduce((acc, agents) => acc + agents.length, 0)
    };
  }

  private calculateAverageTaskTime(): number {
    const completedTasks = this.taskHistory.filter(t => t.status === 'completed');
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((acc, task) => {
      const startTime = task.metadata?.startTime as number;
      const endTime = task.metadata?.endTime as number;
      return acc + (endTime - startTime);
    }, 0);

    return totalTime / completedTasks.length;
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
