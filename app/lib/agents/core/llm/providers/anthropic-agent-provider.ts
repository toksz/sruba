import { BaseLLMAgentProvider, AgentPromptTemplate } from '../base-llm-agent-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { createAnthropic } from '@ai-sdk/anthropic';
import { AgentRole } from '../../types/base-types';

export class AnthropicAgentProvider extends BaseLLMAgentProvider {
	name = 'Anthropic';
	config = {
		apiTokenKey: 'ANTHROPIC_API_KEY',
	};

	staticModels: ModelInfo[] = [
		{
			name: 'claude-3-opus-latest',
			label: 'Claude 3 Opus',
			provider: 'Anthropic',
			maxTokenAllowed: 8000,
		}
	];

	agentPrompts: AgentPromptTemplate[] = [
		{
			role: AgentRole.ARCHITECT,
			systemPrompt: `You are an expert software architect with deep knowledge of system design, patterns, and best practices. 
Your goal is to create robust and scalable architecture designs while considering trade-offs and future maintainability.`,
			taskPrompts: {
				'system_design': 'Design a system architecture that meets the following requirements: {context}',
				'architecture_review': 'Review the following architecture and provide detailed feedback: {context}',
				'tech_decision': 'Make a technology decision for the following scenario: {context}'
			}
		},
		{
			role: AgentRole.CODER,
			systemPrompt: `You are an expert software developer with deep knowledge of coding best practices, design patterns, and clean code principles.
Your goal is to write efficient, maintainable, and well-documented code.`,
			taskPrompts: {
				'implement_feature': 'Implement the following feature according to the specifications: {context}',
				'refactor_code': 'Refactor the following code to improve its quality: {context}',
				'fix_bug': 'Fix the following bug in the codebase: {context}'
			}
		},
		{
			role: AgentRole.REVIEWER,
			systemPrompt: `You are an expert code reviewer with deep knowledge of code quality, security best practices, and performance optimization.
Your goal is to ensure code meets high quality standards and follows best practices.`,
			taskPrompts: {
				'code_review': 'Review the following code changes and provide detailed feedback: {context}',
				'security_audit': 'Perform a security audit on the following code: {context}',
				'performance_review': 'Analyze the performance implications of the following code: {context}'
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
			defaultApiTokenKey: 'ANTHROPIC_API_KEY',
		});
		const anthropic = createAnthropic({
			apiKey,
		});

		return anthropic(model);
	};
}