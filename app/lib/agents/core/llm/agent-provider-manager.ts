import { BaseLLMAgentProvider } from './base-llm-agent-provider';
import * as providers from './registry';
import { defaultProviderOrder } from './registry';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AgentProviderManager');

export class AgentProviderManager {
	private static _instance: AgentProviderManager;
	private _providers: Map<string, BaseLLMAgentProvider> = new Map();
	private readonly _env: any = {};

	private constructor(_env: Record<string, string>) {
		this._registerProvidersFromRegistry();
		this._env = _env;
	}

	static getInstance(env: Record<string, string> = {}): AgentProviderManager {
		if (!AgentProviderManager._instance) {
			AgentProviderManager._instance = new AgentProviderManager(env);
		}
		return AgentProviderManager._instance;
	}

	private _registerProvidersFromRegistry() {
		try {
			// Register providers in preferred order
			for (const providerName of defaultProviderOrder) {
				const ProviderClass = Object.values(providers).find(
					(p: any) => p.prototype instanceof BaseLLMAgentProvider && new p().name === providerName
				);

				if (ProviderClass) {
					const provider = new ProviderClass();
					try {
						this.registerProvider(provider);
					} catch (error: any) {
						logger.warn('Failed To Register Provider: ', provider.name, 'error:', error.message);
					}
				}
			}
		} catch (error) {
			logger.error('Error registering providers:', error);
		}
	}

	registerProvider(provider: BaseLLMAgentProvider) {
		if (this._providers.has(provider.name)) {
			logger.warn(`Provider ${provider.name} is already registered. Skipping.`);
			return;
		}

		logger.info('Registering Agent Provider: ', provider.name);
		this._providers.set(provider.name, provider);
	}

	getProvider(name: string): BaseLLMAgentProvider | undefined {
		return this._providers.get(name);
	}

	getAllProviders(): BaseLLMAgentProvider[] {
		return Array.from(this._providers.values());
	}

	getPreferredProvider(): BaseLLMAgentProvider {
		// Try to get providers in order of preference
		for (const providerName of defaultProviderOrder) {
			const provider = this._providers.get(providerName);
			if (provider) {
				return provider;
			}
		}

		// Fallback to first available provider
		const firstProvider = this._providers.values().next().value;
		if (!firstProvider) {
			throw new Error('No agent providers registered');
		}

		return firstProvider;
	}
}