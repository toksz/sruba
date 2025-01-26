import { BaseLLMAgentProvider, AgentPromptTemplate } from '../base-llm-agent-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { createCohere } from '@ai-sdk/cohere';
import { AgentRole } from '../../types/base-types';

export class CohereAgentProvider extends BaseLLMAgentProvider {
	name = 'Cohere';
	config = {
		apiTokenKey: 'COHERE_API_KEY',
	};

	staticModels: ModelInfo[] = [
		{ 
			name: 'command-r-plus-08-2024',
			label: 'Command R plus Latest',
			provider: 'Cohere',
			maxTokenAllowed: 4096
		}
	];

	agentPrompts: AgentPromptTemplate[] = [
		{
			role: AgentRole.ARCHITECT,
			systemPrompt: `You are an expert software architect specializing in system design and architectural patterns.
Your task is to analyze requirements and create robust, scalable architectures.`,
			taskPrompts: {
				'system_design': 'Design a system architecture that addresses these requirements: {context}',
				'architecture_review': 'Review this architecture and provide detailed feedback: {context}',
				'tech_decision': 'Evaluate and recommend technology choices for: {context}'
			}
		},
		{
			role: AgentRole.CODER,
			systemPrompt: `You are an expert software developer with deep knowledge of coding patterns and best practices.
Your task is to write clean, efficient, and maintainable code.`,
			taskPrompts: {
				'implementation': 'Implement this feature following the specifications: {context}',
				'refactor': 'Refactor this code to improve quality and maintainability: {context}',
				'bug_fix': 'Analyze and fix the following bug: {context}'
			}
		},
		{
			role: AgentRole.REVIEWER,
			systemPrompt: `You are an expert code reviewer focusing on code quality and best practices.
Your task is to review code changes and provide constructive feedback.`,
			taskPrompts: {
				'code_review': 'Review these code changes and provide detailed feedback: {context}',
				'security_audit': 'Perform a security audit on this code: {context}',
				'performance_review': 'Analyze the performance implications of this code: {context}'
			}
		}
	];

	getModelInstance: (options: {
		model: string;
		serverEnv?: Env;
		apiKeys?: Record<string, string>;
		providerSettings?: Record<string, IProviderSetting>;
	}) => LanguageModelV1 = (options) => {
		const { apiKeys, providerSettings, serverEnv, model } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings,
			serverEnv: serverEnv as any,
			defaultBaseUrlKey: '',
			defaultApiTokenKey: 'COHERE_API_KEY',
		});

		const cohere = createCohere({
			apiKey,
		});

		return cohere(model);
	};
}