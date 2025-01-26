import { BaseProvider } from '~/lib/modules/llm/base-provider';
import { AgentRole } from '../types/base-types';
import { LLMManager } from '~/lib/modules/llm/manager';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ProviderAdapter');

export interface AgentPrompt {
	role: AgentRole;
	task: string;
	context: any;
}

export class ProviderAdapter {
	private static _instance: ProviderAdapter;
	private readonly prompts: Record<AgentRole, Record<string, string>> = {
		[AgentRole.ARCHITECT]: {
			system_design: `You are an expert software architect. Design a system architecture that meets these requirements: {context}`,
			architecture_review: `You are an expert software architect. Review this architecture and provide detailed feedback: {context}`,
			tech_decision: `You are an expert software architect. Evaluate and recommend technology choices for: {context}`
		},
		[AgentRole.CODER]: {
			implementation: `You are an expert software developer. Implement this feature following the specifications: {context}`,
			refactor: `You are an expert software developer. Refactor this code to improve quality: {context}`,
			bug_fix: `You are an expert software developer. Fix this bug in the codebase: {context}`
		},
		[AgentRole.REVIEWER]: {
			code_review: `You are an expert code reviewer. Review these changes and provide detailed feedback: {context}`,
			security_audit: `You are an expert security auditor. Perform a security audit on this code: {context}`,
			performance_review: `You are an expert performance engineer. Analyze the performance of this code: {context}`
		}
	};

	private constructor() {}

	static getInstance(): ProviderAdapter {
		if (!ProviderAdapter._instance) {
			ProviderAdapter._instance = new ProviderAdapter();
		}
		return ProviderAdapter._instance;
	}

	async generateResponse(prompt: AgentPrompt, options?: {
		preferredProvider?: string;
		model?: string;
	}): Promise<string> {
		const llmManager = LLMManager.getInstance();
		const provider = options?.preferredProvider ? 
			llmManager.getProvider(options.preferredProvider) || llmManager.getDefaultProvider() :
			llmManager.getDefaultProvider();

		const promptTemplate = this.prompts[prompt.role]?.[prompt.task];
		if (!promptTemplate) {
			throw new Error(`No prompt template found for role ${prompt.role} and task ${prompt.task}`);
		}

		const formattedPrompt = this.formatPrompt(promptTemplate, prompt.context);
		const model = options?.model || this.getDefaultModel(provider);

		try {
			const llm = provider.getModelInstance({
				model,
				serverEnv: process.env as any
			});

			const completion = await llm.complete(formattedPrompt);
			return completion.text;
		} catch (error) {
			logger.error(`Error generating response with provider ${provider.name}:`, error);
			throw error;
		}
	}

	private formatPrompt(template: string, context: any): string {
		return template.replace('{context}', JSON.stringify(context, null, 2));
	}

	private getDefaultModel(provider: BaseProvider): string {
		const models = provider.staticModels;
		// Prefer more capable models
		const preferredModels = [
			'claude-3-opus-latest',
			'command-r-plus-08-2024',
			'gpt-4-turbo'
		];

		for (const modelName of preferredModels) {
			if (models.some(m => m.name === modelName)) {
				return modelName;
			}
		}

		return models[0]?.name || 'gpt-3.5-turbo';
	}

	addCustomPrompt(role: AgentRole, task: string, prompt: string): void {
		if (!this.prompts[role]) {
			this.prompts[role] = {};
		}
		this.prompts[role][task] = prompt;
	}
}