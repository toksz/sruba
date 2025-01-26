import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { AgentRole } from '../types/base-types';

export interface AgentPromptTemplate {
	role: AgentRole;
	systemPrompt: string;
	taskPrompts: Record<string, string>;
}

export abstract class BaseLLMAgentProvider extends BaseProvider {
	abstract agentPrompts: AgentPromptTemplate[];
	
	protected async generateAgentResponse(
		role: AgentRole,
		taskType: string,
		context: any,
		options: {
			model: string;
			serverEnv?: Env;
			apiKeys?: Record<string, string>;
			providerSettings?: Record<string, IProviderSetting>;
		}
	): Promise<string> {
		const promptTemplate = this.agentPrompts.find(p => p.role === role);
		if (!promptTemplate) {
			throw new Error(`No prompt template found for role: ${role}`);
		}

		const taskPrompt = promptTemplate.taskPrompts[taskType];
		if (!taskPrompt) {
			throw new Error(`No task prompt found for type: ${taskType}`);
		}

		const model = this.getModelInstance(options);
		const fullPrompt = this.constructPrompt(promptTemplate.systemPrompt, taskPrompt, context);

		const completion = await model.complete(fullPrompt);
		return completion.text;
	}

	private constructPrompt(systemPrompt: string, taskPrompt: string, context: any): string {
		return `${systemPrompt}\n\nTask: ${taskPrompt}\n\nContext: ${JSON.stringify(context, null, 2)}`;
	}
}