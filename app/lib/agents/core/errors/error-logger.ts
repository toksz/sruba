import { AgentError, TaskError, ErrorSeverity, ErrorContext } from './error-types';

interface ErrorLog {
	id: string;
	timestamp: number;
	error: AgentError | TaskError;
	stackTrace?: string;
	metadata?: Record<string, unknown>;
}

export class ErrorLogger {
	private logs: ErrorLog[] = [];
	private readonly maxLogs: number = 1000;

	logError(error: AgentError | TaskError, metadata?: Record<string, unknown>): void {
		const errorLog: ErrorLog = {
			id: crypto.randomUUID(),
			timestamp: Date.now(),
			error,
			stackTrace: error.stack,
			metadata
		};

		this.logs.push(errorLog);
		if (this.logs.length > this.maxLogs) {
			this.logs.shift();
		}

		// Log to console for development
		console.error(`[${error.name}] ${error.message}`, {
			severity: error.severity,
			agent: error.agent,
			context: error.context,
			...(error instanceof TaskError && { 
				task: error.task,
				failurePoint: error.failurePoint
			})
		});
	}

	getRecentErrors(count: number = 100): ErrorLog[] {
		return this.logs.slice(-count);
	}

	getErrorsBySeverity(severity: ErrorSeverity): ErrorLog[] {
		return this.logs.filter(log => log.error.severity === severity);
	}

	getErrorsByAgent(agentId: string): ErrorLog[] {
		return this.logs.filter(log => log.error.agent === agentId);
	}

	clearLogs(): void {
		this.logs = [];
	}
}