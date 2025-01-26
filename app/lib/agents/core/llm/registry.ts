import { AnthropicAgentProvider } from './providers/anthropic-agent-provider';
import { CohereAgentProvider } from './providers/cohere-agent-provider';

// Export all agent providers
export {
	AnthropicAgentProvider,
	CohereAgentProvider
};

// Default provider order (preferred providers first)
export const defaultProviderOrder = [
	'Anthropic',  // Claude models are preferred for complex reasoning
	'Cohere'      // Command models as backup
];