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
} from './types/event-types';
import { BaseAgent } from './base-agent';
import { EventBus } from './events';
import { ErrorLogger } from './errors';

// Helper class for priority queue
class PriorityQueue<T> {
  private items: { item: T; priority: number }[] = [];

  enqueue(item: T, priority: number): void {
    this.items.push({ item, priority });
    this.items.sort((a, b) => b.priority - a.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  get length(): number {
    return this.items.length;
  }
}

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
  private taskQueue: PriorityQueue<AgentTask> = new PriorityQueue();
  private isProcessing: boolean = false;
  private eventBus: EventBus;
  private metrics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageProcessingTime: number;
    collaborationCount: number;
  } = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageProcessingTime: 0,
    collaborationCount: 0
  };

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
    this.metrics.totalTasks++;
    this.taskQueue.enqueue(task, this.calculateTaskPriority(task));
    if (!this.isProcessing) {
      await this.processTasks();
    }
  }

  private calculateTaskPriority(task: AgentTask): number {
    let priority = task.priority;
    
    // Increase priority for critical tasks
    if (task.metadata?.critical) priority += 10;
    
    // Increase priority for tasks with dependencies
    if (task.dependencies.length > 0) priority += 5;
    
    // Decrease priority for tasks that have failed before
    const failCount = task.metadata?.failCount || 0;
    priority -= failCount * 2;
    
    return priority;
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
    const candidates = Array.from(this.agents.values())
      .filter(agent => {
        const status = agent.getStatus();
        return status.available && agent.hasCapability(task.role);
      })
      .map(agent => ({
        agent,
        score: this.calculateAgentScore(agent, task)
      }))
      .sort((a, b) => b.score - a.score);

    return candidates[0]?.agent || null;
  }

  private calculateAgentScore(agent: BaseAgent, task: AgentTask): number {
    const metrics = agent.getPerformanceMetrics();
    const status = agent.getStatus();
    
    let score = agent.hasCapability(task.role, 0) ? 100 : 0;
    
    // Adjust score based on agent's performance
    score += (metrics.completedTasks / (metrics.completedTasks + metrics.failedTasks)) * 20;
    score -= metrics.averageTaskTime / 1000; // Penalize slower agents
    
    // Prefer agents with relevant experience
    if (status.currentTask?.type === task.type) score += 10;
    
    return score;
  }

  async getSystemMetrics(): Promise<{
    agentMetrics: Map<string, any>;
    systemMetrics: typeof this.metrics;
    taskDistribution: Map<AgentRole, number>;
  }> {
    const agentMetrics = new Map();
    const taskDistribution = new Map<AgentRole, number>();
    
    for (const [id, agent] of this.agents) {
      const metrics = agent.getPerformanceMetrics();
      agentMetrics.set(id, metrics);
      
      const status = agent.getStatus();
      const count = taskDistribution.get(status.role) || 0;
      taskDistribution.set(status.role, count + 1);
    }
    
    return {
      agentMetrics,
      systemMetrics: { ...this.metrics },
      taskDistribution
    };
  }

  private async handleTaskCompletion(event: TaskEvent): Promise<void> {
    this.metrics.completedTasks++;
    this.updateMetrics(event);
    
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
    this.metrics.failedTasks++;
    this.updateMetrics(event);
    
    // Enhanced recovery logic
    const task = event.task;
    const failCount = (task.metadata?.failCount || 0) + 1;
    
    if (failCount < 3) {
      // Retry with modified task
      const retryTask = {
        ...task,
        metadata: {
          ...task.metadata,
          failCount,
          lastError: event.metadata?.error
        }
      };
      await this.submitTask(retryTask);
    }
    
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

  private updateMetrics(event: TaskEvent): void {
    const startTime = event.task.metadata?.startTime as number;
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.completedTasks - 1) + processingTime) 
      / this.metrics.completedTasks;
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
