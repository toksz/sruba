import { AgentError, TaskError, ErrorSeverity, ErrorContext } from './error-types';
import { StepBasedRecoveryStrategy, RecoveryResult, RecoveryType } from './recovery-strategies';

interface ErrorLog {
	id: string;
	timestamp: number;
	error: AgentError | TaskError;
	stackTrace?: string;
	metadata?: Record<string, unknown>;
	recoveryAttempts: number;
	recoveryResults?: RecoveryResult[];
}

interface ErrorBatch {
	batchId: string;
	errors: ErrorLog[];
	timestamp: number;
}

export class ErrorLogger {
	private logs: ErrorLog[] = [];
	private batches: ErrorBatch[] = [];
	private readonly maxLogs: number = 1000;
	private readonly batchSize: number = 10;
	private currentBatch: ErrorLog[] = [];
	private recoveryStrategies: Map<string, StepBasedRecoveryStrategy> = new Map();

	registerRecoveryStrategy(name: string, strategy: StepBasedRecoveryStrategy): void {
		this.recoveryStrategies.set(name, strategy);
	}

	async logError(error: AgentError | TaskError, metadata?: Record<string, unknown>): Promise<void> {
		const errorLog: ErrorLog = {
			id: crypto.randomUUID(),
			timestamp: Date.now(),
			error,
			stackTrace: error.stack,
			metadata,
			recoveryAttempts: 0,
			recoveryResults: []
		};

		await this.attemptRecovery(errorLog);
		this.addToBatch(errorLog);
		this.logs.push(errorLog);
		
		if (this.logs.length > this.maxLogs) {
			this.logs.shift();
		}

		console.error(`[${error.name}] ${error.message}`, {
			severity: error.severity,
			agent: error.agent,
			context: error.context,
			recoveryAttempts: errorLog.recoveryAttempts,
			recoveryResults: errorLog.recoveryResults,
			...(error instanceof TaskError && { 
				task: error.task,
				failurePoint: error.failurePoint
			})
		});
	}

	private async attemptRecovery(errorLog: ErrorLog): Promise<void> {
		for (const [name, strategy] of this.recoveryStrategies) {
			if (errorLog.recoveryAttempts >= 3) break;

			try {
				const result = await strategy.execute();
				errorLog.recoveryResults?.push(result);
				errorLog.recoveryAttempts++;
				
				if (result.success) break;
			} catch (recoveryError) {
				errorLog.metadata = {
					...errorLog.metadata,
					recoveryError
				};
			}
		}
	}

	private addToBatch(errorLog: ErrorLog): void {
		this.currentBatch.push(errorLog);
		if (this.currentBatch.length >= this.batchSize) {
			this.flushBatch();
		}
	}

	private flushBatch(): void {
		if (this.currentBatch.length > 0) {
			this.batches.push({
				batchId: crypto.randomUUID(),
				errors: [...this.currentBatch],
				timestamp: Date.now()
			});
			this.currentBatch = [];
		}
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

	getErrorBatches(count: number = 10): ErrorBatch[] {
		return this.batches.slice(-count);
	}

	clearLogs(): void {
		this.logs = [];
		this.batches = [];
		this.currentBatch = [];
	}
}