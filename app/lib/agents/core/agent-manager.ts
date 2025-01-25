import { EventEmitter } from 'events';
import { BaseAgent } from './base-agent';
import { 
  AgentRole, 
  AgentTask, 
  AgentContext,
  EventType,
  TaskEvent,
  AgentEvent,
  CollaborationEvent,
  StateChangeEvent,
  ErrorEvent
} from './types';

// Helper function for generating UUIDs
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class AgentManager extends EventEmitter {
  private agents: Map<string, BaseAgent> = new Map();
  private taskQueue: AgentTask[] = [];
  private isProcessing: boolean = false;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on(EventType.TASK_COMPLETED, this.handleTaskCompletion.bind(this));
    this.on(EventType.TASK_FAILED, this.handleTaskFailure.bind(this));
    this.on(EventType.COLLABORATION_REQUESTED, this.handleCollaborationRequest.bind(this));
  }

  registerAgent(agent: BaseAgent): void {
    const status = agent.getStatus();
    this.agents.set(status.id, agent);
    
    // Forward agent events to manager with proper typing
    agent.on(EventType.TASK_STARTED, (event: TaskEvent) => this.emit(event.type, event));
    agent.on(EventType.TASK_COMPLETED, (event: TaskEvent) => this.emit(event.type, event));
    agent.on(EventType.TASK_FAILED, (event: TaskEvent) => this.emit(event.type, event));
    agent.on(EventType.COLLABORATION_REQUESTED, (event: CollaborationEvent) => this.emit(event.type, event));
    agent.on(EventType.STATE_CHANGED, (event: StateChangeEvent) => this.emit(event.type, event));

    // Emit agent registration event
    const registrationEvent: AgentEvent = {
      id: generateUUID(),
      type: EventType.AGENT_REGISTERED,
      timestamp: Date.now(),
      source: this.constructor.name,
      agentId: status.id,
      role: status.role
    };
    this.emit(EventType.AGENT_REGISTERED, registrationEvent);
  }

  async submitTask(task: AgentTask): Promise<void> {
    this.taskQueue.push(task);
    if (!this.isProcessing) {
      await this.processTasks();
    }
  }

  private async processTasks(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) return;

    this.isProcessing = true;
    
    try {
      while (this.taskQueue.length > 0) {
        const task = this.taskQueue[0];
        const agent = await this.findBestAgent(task);

        if (agent) {
          const success = await agent.assignTask(task);
          if (success) {
            this.taskQueue.shift(); // Remove completed task
          } else {
            // Move failed task to end of queue for retry
            this.taskQueue.push(this.taskQueue.shift()!);
          }
        } else {
          // No available agent, will retry later
          break;
        }
      }
    } catch (error) {
      const errorEvent: ErrorEvent = {
        id: generateUUID(),
        type: EventType.ERROR_OCCURRED,
        timestamp: Date.now(),
        source: this.constructor.name,
        error: error as Error,
        context: { taskQueue: this.taskQueue },
        severity: 'high'
      };
      this.emit(EventType.ERROR_OCCURRED, errorEvent);
    } finally {
      this.isProcessing = false;
    }

    // If there are remaining tasks, schedule next processing
    if (this.taskQueue.length > 0) {
      setTimeout(() => this.processTasks(), 1000);
    }
  }

  private async findBestAgent(task: AgentTask): Promise<BaseAgent | null> {
    let bestAgent: BaseAgent | null = null;
    let highestConfidence = 0;

    for (const agent of this.agents.values()) {
      const status = agent.getStatus();
      if (!status.available) continue;

      if (agent.hasCapability(task.role)) {
        const confidence = agent.hasCapability(task.role, 0) ? 1 : 0;
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestAgent = agent;
        }
      }
    }

    return bestAgent;
  }

  private async handleTaskCompletion(event: TaskEvent): Promise<void> {
    // Update shared context
    const sharedContext: Partial<AgentContext> = {
      recentActions: [{
        timestamp: Date.now(),
        action: `${event.task.role} completed ${event.task.type}`,
        result: event.task
      }]
    };

    // Update context for all agents
    for (const agent of this.agents.values()) {
      agent.updateContext(sharedContext);
    }
  }

  private async handleTaskFailure(event: TaskEvent): Promise<void> {
    // Implement recovery or retry logic
    console.error('Task failed:', event);
    
    // Notify other agents of failure
    const sharedContext: Partial<AgentContext> = {
      recentActions: [{
        timestamp: Date.now(),
        action: `${event.task.role} failed ${event.task.type}`,
        result: event.metadata
      }]
    };

    // Update context for all agents
    for (const agent of this.agents.values()) {
      agent.updateContext(sharedContext);
    }
  }

  private async handleCollaborationRequest(event: CollaborationEvent): Promise<void> {
    const availableAgent = Array.from(this.agents.values()).find(agent => 
      agent.hasCapability(event.targetRole) && agent.getStatus().available
    );

    if (availableAgent) {
      // Handle collaboration acceptance
      const acceptEvent: CollaborationEvent = {
        id: generateUUID(),
        type: EventType.COLLABORATION_ACCEPTED,
        timestamp: Date.now(),
        source: this.constructor.name,
        requesterId: event.requesterId,
        targetRole: event.targetRole,
        context: event.context
      };
      this.emit(EventType.COLLABORATION_ACCEPTED, acceptEvent);
    }
  }

  // Cleanup
  async shutdown(): Promise<void> {
    for (const agent of this.agents.values()) {
      await agent.cleanup();
    }
    this.agents.clear();
    this.taskQueue = [];
    this.removeAllListeners();
  }
}
