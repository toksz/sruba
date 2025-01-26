import { AgentError, ErrorSeverity } from './error-types';
import { BaseRecoveryStrategy } from './recovery-strategy';

export class AgentRecoveryStrategy extends BaseRecoveryStrategy {
	protected readonly maxAttempts: number = 2;

	canHandle(error: AgentError): boolean {
		return error instanceof AgentError && 
			   error.recoverable && 
			   error.severity !== ErrorSeverity.CRITICAL;
	}

	protected async attemptRecovery(error: AgentError): Promise<void> {
		await this.logger.logError(error, {
			recovery: {
				strategy: 'AgentRecoveryStrategy',
				attempt: error.recoveryAttempts || 0,
				action: 'agent_restart'
			}
		});
		
		// Additional recovery logic would go here
		// For example, restarting the agent or clearing its state
	}
}