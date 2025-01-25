export enum AgentRole {
  ARCHITECT = 'architect',
  CODER = 'coder',
  DESIGNER = 'designer',
  REVIEWER = 'reviewer',
  PROJECT_MANAGER = 'project_manager'
}

export interface AgentCapability {
  role: AgentRole;
  confidence: number;  // 0-1 score for this capability
  specialties: string[];  // e.g. ["React", "TypeScript"] for Coder
}

export interface AgentTask {
  id: string;
  role: AgentRole;
  type: string;
  priority: number;
  description: string;
  context: Record<string, unknown>;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedAgent?: string;
}

export interface AgentContext {
  projectInfo: {
    name: string;
    description: string;
    techStack: string[];
    constraints: string[];
  };
  currentTask?: AgentTask;
  recentActions: Array<{
    timestamp: number;
    action: string;
    result: unknown;
  }>;
  sharedKnowledge: Map<string, unknown>;
}

// Role-specific interfaces
export interface ArchitectTask extends AgentTask {
  type: 'system_design' | 'architecture_review' | 'tech_decision';
  output: {
    diagram?: string;
    decisions: Array<{
      area: string;
      decision: string;
      rationale: string;
    }>;
    components: Array<{
      name: string;
      purpose: string;
      dependencies: string[];
    }>;
  };
}

export interface CoderTask extends AgentTask {
  type: 'implementation' | 'refactor' | 'bug_fix' | 'optimization';
  output: {
    files: Array<{
      path: string;
      changes: string;
      tests?: string;
    }>;
    dependencies?: Record<string, string>;
  };
}

export interface DesignerTask extends AgentTask {
  type: 'ui_design' | 'style_guide' | 'component_design';
  output: {
    components: Array<{
      name: string;
      specs: {
        layout: string;
        colors: string[];
        spacing: Record<string, string>;
      };
      accessibility: Record<string, boolean>;
    }>;
    assets?: Record<string, string>;
  };
}

export interface ReviewerTask extends AgentTask {
  type: 'code_review' | 'design_review' | 'security_audit';
  output: {
    status: 'approved' | 'changes_requested' | 'rejected';
    comments: Array<{
      path?: string;
      line?: number;
      severity: 'info' | 'warning' | 'error';
      message: string;
      suggestion?: string;
    }>;
    metrics?: Record<string, number>;
  };
}

export interface ProjectManagerTask extends AgentTask {
  type: 'planning' | 'coordination' | 'status_update';
  output: {
    timeline?: Array<{
      phase: string;
      startDate: string;
      endDate: string;
      dependencies: string[];
    }>;
    risks?: Array<{
      description: string;
      severity: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
    nextActions: Array<{
      task: string;
      assignee: AgentRole;
      priority: number;
    }>;
  };
}

// Event System Types
export enum EventType {
  // Task Events
  TASK_CREATED = 'task_created',
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  
  // Agent Events
  AGENT_REGISTERED = 'agent_registered',
  AGENT_UNREGISTERED = 'agent_unregistered',
  AGENT_STATUS_CHANGED = 'agent_status_changed',
  
  // Collaboration Events
  COLLABORATION_REQUESTED = 'collaboration_requested',
  COLLABORATION_ACCEPTED = 'collaboration_accepted',
  COLLABORATION_COMPLETED = 'collaboration_completed',
  COLLABORATION_FAILED = 'collaboration_failed',
  
  // System Events
  STATE_CHANGED = 'state_changed',
  ERROR_OCCURRED = 'error_occurred',
  SYSTEM_READY = 'system_ready',
  SYSTEM_SHUTDOWN = 'system_shutdown'
}

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: number;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface TaskEvent extends BaseEvent {
  type: Extract<EventType, 
    | EventType.TASK_CREATED 
    | EventType.TASK_STARTED 
    | EventType.TASK_COMPLETED 
    | EventType.TASK_FAILED
  >;
  task: AgentTask;
  agentId?: string;
}

export interface AgentEvent extends BaseEvent {
  type: Extract<EventType, 
    | EventType.AGENT_REGISTERED 
    | EventType.AGENT_UNREGISTERED 
    | EventType.AGENT_STATUS_CHANGED
  >;
  agentId: string;
  role: AgentRole;
  capabilities?: AgentCapability[];
}

export interface CollaborationEvent extends BaseEvent {
  type: Extract<EventType, 
    | EventType.COLLABORATION_REQUESTED 
    | EventType.COLLABORATION_ACCEPTED 
    | EventType.COLLABORATION_COMPLETED 
    | EventType.COLLABORATION_FAILED
  >;
  requesterId: string;
  targetRole: AgentRole;
  context: AgentContext;
}

export interface StateChangeEvent extends BaseEvent {
  type: EventType.STATE_CHANGED;
  entityId: string;
  entityType: 'agent' | 'task' | 'system';
  previousState: unknown;
  newState: unknown;
}

export interface ErrorEvent extends BaseEvent {
  type: EventType.ERROR_OCCURRED;
  error: Error;
  context: unknown;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemEvent extends BaseEvent {
  type: Extract<EventType, 
    | EventType.SYSTEM_READY 
    | EventType.SYSTEM_SHUTDOWN
  >;
  status: 'initializing' | 'ready' | 'shutting_down' | 'error';
  activeAgents?: number;
  pendingTasks?: number;
}

export type SrubaEvent = 
  | TaskEvent 
  | AgentEvent 
  | CollaborationEvent 
  | StateChangeEvent 
  | ErrorEvent
  | SystemEvent;

export type EventHandler = (event: SrubaEvent) => Promise<void>;
export type EventFilter = (event: SrubaEvent) => boolean;
