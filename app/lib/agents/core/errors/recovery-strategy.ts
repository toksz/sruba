import { AgentError, TaskError, ErrorSeverity } from './error-types';
import { ErrorLogger } from './error-logger';

export interface IRecoveryStrategy {
	canHandle(error: AgentError): boolean;
	handle(error: AgentError): Promise<void>;
	getMaxAttempts(): number;
}

export class BaseRecoveryStrategy implements IRecoveryStrategy {
	protected readonly maxAttempts: number = 3;
	protected readonly logger: ErrorLogger;

	constructor(logger: ErrorLogger) {
		this.logger = logger;
	}

	canHandle(error: AgentError): boolean {
		return error.recoverable;
	}

	async handle(error: AgentError): Promise<void> {
		if (!this.canHandle(error)) {
			throw new Error('Cannot handle unrecoverable error');
		}
		await this.attemptRecovery(error);
	}

	getMaxAttempts(): number {
		return this.maxAttempts;
	}

	protected async attemptRecovery(error: AgentError): Promise<void> {
		throw new Error('Recovery strategy not implemented');
	}
}

export class TaskRecoveryStrategy extends BaseRecoveryStrategy {
	canHandle(error: AgentError): boolean {
		return error instanceof TaskError && error.recoverable;
	}

	protected async attemptRecovery(error: TaskError): Promise<void> {
		// Implement task-specific recovery logic
		await this.logger.logError(error, {
			recovery: {
				strategy: 'TaskRecoveryStrategy',
				attempt: error.recoveryAttempts || 0
			}
		});
	}
}