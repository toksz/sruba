import { BaseAgent } from './base-agent';
import { EventBus } from './events';
import { ErrorLogger } from './errors';
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

export class AgentManager {
  private agents: Map<string, BaseAgent> = new Map();
  private taskQueue: AgentTask[] = [];
  private isProcessing: boolean = false;
  private eventBus: EventBus;

  constructor(errorLogger: ErrorLogger, eventStorePath: string) {
    this.eventBus = new EventBus(errorLogger, eventStorePath);
  }

  async initialize(): Promise<void> {
    await this.eventBus.initialize();
    await this.setupEventHandlers();
  }

  private async setupEventHandlers(): Promise<void> {
    this.eventBus.subscribe({ type: EventType.TASK_COMPLETED }, this.handleTaskCompletion.bind(this));
    this.eventBus.subscribe({ type: EventType.TASK_FAILED }, this.handleTaskFailure.bind(this));
    this.eventBus.subscribe({ type: EventType.COLLABORATION_REQUESTED }, this.handleCollaborationRequest.bind(this));
  }

  async registerAgent(agent: BaseAgent): Promise<void> {
    const status = agent.getStatus();
    this.agents.set(status.id, agent);
    agent.setEventBus(this.eventBus);

    // Publish agent registration event
    await this.eventBus.publish({
      id: generateUUID(),
      type: EventType.AGENT_REGISTERED,
      timestamp: Date.now(),
      source: this.constructor.name,
      agentId: status.id,
      role: status.role
    });

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
        await this.eventBus.publish(errorEvent);
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

  }
}
