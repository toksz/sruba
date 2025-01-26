import { AgentError, ErrorSeverity } from './error-types';
import { BaseRecoveryStrategy } from './recovery-strategy';

export class CriticalRecoveryStrategy extends BaseRecoveryStrategy {
	protected readonly maxAttempts: number = 1; // Critical errors get only one attempt

	canHandle(error: AgentError): boolean {
		return error.severity === ErrorSeverity.CRITICAL && error.recoverable;
	}

	protected async attemptRecovery(error: AgentError): Promise<void> {
		await this.logger.logError(error, {
			recovery: {
				strategy: 'CriticalRecoveryStrategy',
				attempt: error.recoveryAttempts || 0,
				action: 'system_stabilization'
			}
		});

		// Critical recovery actions:
		// 1. Log to monitoring system
		// 2. Attempt system stabilization
		// 3. Notify system administrators
	}
}