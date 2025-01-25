import { AgentError, TaskError, ErrorSeverity } from './error-types';

export enum RecoveryType {
	RETRY = 'retry',
	FALLBACK = 'fallback',
	COMPENSATE = 'compensate',
	ESCALATE = 'escalate'
}

export interface RecoveryStep {
	type: RecoveryType;
	action: () => Promise<void>;
	validation: () => Promise<boolean>;
}

export interface RecoveryResult {
	success: boolean;
	error?: Error;
	steps: {
		type: RecoveryType;
		success: boolean;
		timestamp: number;
	}[];
}

export class RecoveryStrategy {
	constructor(
		private steps: RecoveryStep[],
		private fallback?: RecoveryStrategy
	) {}

	async execute(): Promise<RecoveryResult> {
		const result: RecoveryResult = {
			success: false,
			steps: []
		};

		for (const step of this.steps) {
			try {
				await step.action();
				const isValid = await step.validation();
				
				result.steps.push({
					type: step.type,
					success: isValid,
					timestamp: Date.now()
				});

				if (!isValid && this.fallback) {
					return this.fallback.execute();
				}
			} catch (error) {
				result.error = error as Error;
				result.steps.push({
					type: step.type,
					success: false,
					timestamp: Date.now()
				});

				if (this.fallback) {
					return this.fallback.execute();
				}
				break;
			}
		}

		result.success = result.steps.every(step => step.success);
		return result;
	}
}