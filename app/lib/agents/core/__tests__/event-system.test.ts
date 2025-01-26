import fs from 'fs/promises';
import { 
  EventType,
  TaskEvent,
  AgentEvent,
  CollaborationEvent,
  StateChangeEvent,
  ErrorEvent,
  AgentRole,
  AgentTask
} from '../types';
import { BaseAgent } from '../base-agent';
import { AgentManager } from '../agent-manager';
import { ErrorLogger } from '../errors';
import { EventBus } from '../events';
import path from 'path';

console.log('Starting test file execution');

// Mock implementation of BaseAgent for testing
class TestAgent extends BaseAgent {
  async analyzeTask(task: AgentTask): Promise<boolean> {
    console.log('Analyzing task:', task);
    return true;
  }

  async executeTask(task: AgentTask): Promise<unknown> {
    console.log('Executing task:', task);
    return { success: true };
  }

  async reviewOutput(output: unknown): Promise<boolean> {
    console.log('Reviewing output:', output);
    return true;
  }
}

describe('Event System', () => {
  console.log('Starting Event System test suite');
  
  let agent: TestAgent;
  let manager: AgentManager;
  let errorLogger: ErrorLogger;
  let eventBus: EventBus;
  const mockTask: AgentTask = {
    id: 'test-task-1',
    role: AgentRole.CODER,
    type: 'implementation',
    priority: 1,
    description: 'Test task',
    context: {},
    dependencies: [],
    status: 'pending'
  };

  beforeEach(async () => {
    console.log('Setting up test environment');
    const testStorePath = path.join(__dirname, 'test-events');
    errorLogger = new ErrorLogger();
    eventBus = new EventBus(errorLogger, testStorePath);
    await eventBus.initialize();
    const sharedKnowledge = new Map<string, unknown>();
    agent = new TestAgent(
      'test-agent-1',
      AgentRole.CODER,
      [{ role: AgentRole.CODER, confidence: 1, specialties: ['testing'] }],
      {
        projectInfo: {
          name: 'test',
          description: 'test project',
          techStack: [],
          constraints: []
        },
        recentActions: [],
        sharedKnowledge
      }
    );
    manager = new AgentManager(errorLogger, testStorePath);
    await manager.initialize();
    console.log('Test environment setup complete');
  });

  afterEach(async () => {
    try {
      const testStorePath = path.join(__dirname, 'test-events');
      await fs.rm(testStorePath, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up test files:', error);
    }
  });

  describe('Task Events', () => {
    it('should publish task started event when task is assigned', async () => {
      console.log('Starting task started event test');
      let capturedEvent: TaskEvent | null = null;
      const taskStartedPromise = new Promise<void>((resolve) => {
        eventBus.subscribe(EventType.TASK_STARTED, (event: TaskEvent) => {
          capturedEvent = event;
          resolve();
        });
      });

      await manager.registerAgent(agent);
      await agent.assignTask(mockTask);
      await taskStartedPromise;

      expect(capturedEvent).toBeTruthy();
      expect(capturedEvent?.type).toBe(EventType.TASK_STARTED);
      expect(capturedEvent?.task).toEqual(mockTask);
      expect(capturedEvent?.agentId).toBe('test-agent-1');
    });

    it('should publish task completed event on successful execution', async () => {
      console.log('Starting task completed event test');
      let capturedEvent: TaskEvent | null = null;
      const taskCompletedPromise = new Promise<void>((resolve) => {
        eventBus.subscribe(EventType.TASK_COMPLETED, (event: TaskEvent) => {
          capturedEvent = event;
          resolve();
        });
      });

      await manager.registerAgent(agent);
      await agent.assignTask(mockTask);
      await taskCompletedPromise;

      expect(capturedEvent).toBeTruthy();
      expect(capturedEvent?.type).toBe(EventType.TASK_COMPLETED);
      expect(capturedEvent?.task.status).toBe('completed');
      expect(capturedEvent?.agentId).toBe('test-agent-1');
    });
  });

  describe('Agent Events', () => {
    it('should publish agent registered event when agent is registered', async () => {
      console.log('Starting agent registered event test');
      let capturedEvent: AgentEvent | null = null;
      const agentRegisteredPromise = new Promise<void>((resolve) => {
        eventBus.subscribe(EventType.AGENT_REGISTERED, (event: AgentEvent) => {
          capturedEvent = event;
          resolve();
        });
      });

      await manager.registerAgent(agent);
      await agentRegisteredPromise;

      expect(capturedEvent).toBeTruthy();
      expect(capturedEvent?.type).toBe(EventType.AGENT_REGISTERED);
      expect(capturedEvent?.agentId).toBe('test-agent-1');
      expect(capturedEvent?.role).toBe(AgentRole.CODER);
    });
  });

  describe('State Change Events', () => {
    it('should publish state change event when context is updated', async () => {
      console.log('Starting state change event test');
      let capturedEvent: StateChangeEvent | null = null;
      const stateChangePromise = new Promise<void>((resolve) => {
        eventBus.subscribe(EventType.STATE_CHANGED, (event: StateChangeEvent) => {
          capturedEvent = event;
          resolve();
        });
      });

      const update = {
        recentActions: [{
          timestamp: Date.now(),
          action: 'test action',
          result: null
        }]
      };

      await manager.registerAgent(agent);
      agent.updateContext(update);
      await stateChangePromise;

      expect(capturedEvent).toBeTruthy();
      expect(capturedEvent?.type).toBe(EventType.STATE_CHANGED);
      expect(capturedEvent?.entityId).toBe('test-agent-1');
      expect(capturedEvent?.entityType).toBe('agent');
    });
  });

  describe('Error Events', () => {
    it('should publish error event when task processing fails', async () => {
      console.log('Starting error event test');
      let capturedEvent: TaskEvent | null = null;
      const taskFailedPromise = new Promise<void>((resolve) => {
        eventBus.subscribe(EventType.TASK_FAILED, (event: TaskEvent) => {
          capturedEvent = event;
          resolve();
        });
      });

      const sharedKnowledge = new Map<string, unknown>();
      const errorAgent = new class extends TestAgent {
        async executeTask() {
          console.log('Throwing test error');
          throw new Error('Test error');
        }
      }(
        'error-agent',
        AgentRole.CODER,
        [{ role: AgentRole.CODER, confidence: 1, specialties: ['testing'] }],
        {
          projectInfo: {
            name: 'test',
            description: 'test project',
            techStack: [],
            constraints: []
          },
          recentActions: [],
          sharedKnowledge
        }
      );

      await manager.registerAgent(errorAgent);
      await errorAgent.assignTask(mockTask);
      await taskFailedPromise;

      expect(capturedEvent).toBeTruthy();
      expect(capturedEvent?.type).toBe(EventType.TASK_FAILED);
      expect(capturedEvent?.task.status).toBe('failed');
      expect(capturedEvent?.metadata).toHaveProperty('error');
    });
  });

  describe('Event Propagation', () => {
    it('should propagate events from agent to manager', async () => {
      console.log('Starting event propagation test');
      let capturedEvent: TaskEvent | null = null;
      const managerTaskStartedPromise = new Promise<void>((resolve) => {
        eventBus.subscribe(EventType.TASK_STARTED, (event: TaskEvent) => {
          capturedEvent = event;
          resolve();
        });
      });

      await manager.registerAgent(agent);
      await agent.assignTask(mockTask);
      await managerTaskStartedPromise;

      expect(capturedEvent).toBeTruthy();
      expect(capturedEvent?.type).toBe(EventType.TASK_STARTED);
      expect(capturedEvent?.agentId).toBe('test-agent-1');
    });
  });
});
