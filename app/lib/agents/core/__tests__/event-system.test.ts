import { EventEmitter } from 'events';
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

  beforeEach(() => {
    console.log('Setting up test environment');
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
    manager = new AgentManager();
    console.log('Test environment setup complete');
  });

  describe('Task Events', () => {
    it('should emit task started event when task is assigned', async () => {
      console.log('Starting task started event test');
      const taskStartedPromise = new Promise<TaskEvent>(resolve => {
        agent.once(EventType.TASK_STARTED, resolve);
      });

      await agent.assignTask(mockTask);
      const event = await taskStartedPromise;
      console.log('Received task started event:', event);

      expect(event.type).toBe(EventType.TASK_STARTED);
      expect(event.task).toEqual(mockTask);
      expect(event.agentId).toBe('test-agent-1');
    });

    it('should emit task completed event on successful execution', async () => {
      console.log('Starting task completed event test');
      const taskCompletedPromise = new Promise<TaskEvent>(resolve => {
        agent.once(EventType.TASK_COMPLETED, resolve);
      });

      await agent.assignTask(mockTask);
      const event = await taskCompletedPromise;
      console.log('Received task completed event:', event);

      expect(event.type).toBe(EventType.TASK_COMPLETED);
      expect(event.task.status).toBe('completed');
      expect(event.agentId).toBe('test-agent-1');
    });
  });

  describe('Agent Events', () => {
    it('should emit agent registered event when agent is registered', () => {
      console.log('Starting agent registered event test');
      const agentRegisteredPromise = new Promise<AgentEvent>(resolve => {
        manager.once(EventType.AGENT_REGISTERED, resolve);
      });

      manager.registerAgent(agent);
      
      return expect(agentRegisteredPromise).resolves.toMatchObject({
        type: EventType.AGENT_REGISTERED,
        agentId: 'test-agent-1',
        role: AgentRole.CODER
      });
    });
  });

  describe('State Change Events', () => {
    it('should emit state change event when context is updated', () => {
      console.log('Starting state change event test');
      const stateChangePromise = new Promise<StateChangeEvent>(resolve => {
        agent.once(EventType.STATE_CHANGED, resolve);
      });

      const update = {
        recentActions: [{
          timestamp: Date.now(),
          action: 'test action',
          result: null
        }]
      };

      agent.updateContext(update);

      return expect(stateChangePromise).resolves.toMatchObject({
        type: EventType.STATE_CHANGED,
        entityId: 'test-agent-1',
        entityType: 'agent'
      });
    });
  });

  describe('Error Events', () => {
    it('should emit error event when task processing fails', async () => {
      console.log('Starting error event test');
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

      const taskFailedPromise = new Promise<TaskEvent>(resolve => {
        errorAgent.once(EventType.TASK_FAILED, resolve);
      });

      await errorAgent.assignTask(mockTask);
      const event = await taskFailedPromise;
      console.log('Received task failed event:', event);

      expect(event.type).toBe(EventType.TASK_FAILED);
      expect(event.task.status).toBe('failed');
      expect(event.metadata).toHaveProperty('error');
    });
  });

  describe('Event Propagation', () => {
    it('should propagate events from agent to manager', async () => {
      console.log('Starting event propagation test');
      const managerTaskStartedPromise = new Promise<TaskEvent>(resolve => {
        manager.once(EventType.TASK_STARTED, resolve);
      });

      manager.registerAgent(agent);
      await agent.assignTask(mockTask);
      
      const event = await managerTaskStartedPromise;
      console.log('Received propagated event:', event);

      expect(event.type).toBe(EventType.TASK_STARTED);
      expect(event.agentId).toBe('test-agent-1');
    });
  });
});
