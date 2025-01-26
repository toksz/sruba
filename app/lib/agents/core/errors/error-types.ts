import { AgentId, TaskId } from '../types/base-types';

export enum ErrorSeverity {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	CRITICAL = 'critical'
}

export interface ErrorContext {
	timestamp: number;
	location: string;
	metadata?: Record<string, unknown>;
}

export class AgentError extends Error {
	readonly agent: AgentId;
	readonly severity: ErrorSeverity;
	readonly recoverable: boolean;
	readonly context: ErrorContext;
	readonly recoveryAttempts: number;

	constructor(
		message: string,
		agent: AgentId,
		severity: ErrorSeverity,
		recoverable: boolean,
		context: ErrorContext
	) {
		super(message);
		this.name = 'AgentError';
		this.agent = agent;
		this.severity = severity;
		this.recoverable = recoverable;
		this.context = context;
		this.recoveryAttempts = 0;
	}
}

export class TaskError extends AgentError {
	readonly task: TaskId;
	readonly failurePoint: string;
	readonly recoveryStrategy?: string;

	constructor(
		message: string,
		agent: AgentId,
		task: TaskId,
		failurePoint: string,
		severity: ErrorSeverity,
		context: ErrorContext,
		recoveryStrategy?: string
	) {
		super(message, agent, severity, true, context);
		this.name = 'TaskError';
		this.task = task;
		this.failurePoint = failurePoint;
		this.recoveryStrategy = recoveryStrategy;
	}
}