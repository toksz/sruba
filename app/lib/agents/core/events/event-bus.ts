import { SrubaEvent, EventHandler, EventFilter, EventType } from '../types';
import { EventStore } from './event-store';
import { EventValidator, EventValidationError } from './event-validator';
import { ErrorLogger } from '../errors/error-logger';

type TypedEventHandler<T extends SrubaEvent> = (event: T) => Promise<void>;

export class EventBus {
	private handlers: Map<EventType | symbol, Set<TypedEventHandler<any>>>;
	private readonly WILDCARD = Symbol('*');
	private eventStore: EventStore;
	private validator: EventValidator;
	private errorLogger: ErrorLogger;

	constructor(errorLogger: ErrorLogger, storePath: string) {
		this.handlers = new Map();
		this.eventStore = new EventStore(storePath);
		this.validator = new EventValidator();
		this.errorLogger = errorLogger;
	}

	async initialize(): Promise<void> {
		await this.eventStore.initialize();
	}

	async publish(event: SrubaEvent): Promise<void> {
		try {
			this.validator.validate(event);
			const storedEvent = await this.eventStore.store(event);
			const typeHandlers = this.handlers.get(event.type) || new Set();
			const wildcardHandlers = this.handlers.get(this.WILDCARD) || new Set();
			
			const promises = [...typeHandlers, ...wildcardHandlers].map(handler => 
				this.executeHandler(handler, storedEvent)
			);
			await Promise.all(promises);
		} catch (error) {
			if (error instanceof EventValidationError) {
				await this.errorLogger.logError(error);
				throw error;
			}
			throw error;
		}
	}

	private async executeHandler(handler: TypedEventHandler<any>, event: SrubaEvent): Promise<void> {
		try {
			await handler(event);
		} catch (error) {
			await this.errorLogger.logError(new EventValidationError(
				'Event handler execution failed',
				event
			));
		}
	}

	async replay(fromSequence?: number): Promise<void> {
		try {
			const events = this.eventStore.getEvents(fromSequence);
			for (const event of events) {
				try {
					this.validator.validate(event);
					const typeHandlers = this.handlers.get(event.type) || new Set();
					const wildcardHandlers = this.handlers.get(this.WILDCARD) || new Set();
					
					const promises = [...typeHandlers, ...wildcardHandlers].map(handler => 
						this.executeHandler(handler, event)
					);
					await Promise.all(promises);
				} catch (error) {
					await this.errorLogger.logError(new EventValidationError(
						'Event replay failed',
						event
					));
					// Continue with next event even if current one fails
					continue;
				}
			}
		} catch (error) {
			await this.errorLogger.logError(new EventValidationError(
				'Event replay system error',
				{ id: 'system', type: EventType.ERROR_OCCURRED, timestamp: Date.now(), source: 'EventBus' }
			));
			throw error;
		}
	}

	subscribe<T extends SrubaEvent>(
		pattern: EventType | ((event: SrubaEvent) => event is T), 
		handler: TypedEventHandler<T>
	): () => void {
		const key = typeof pattern === 'function' ? this.WILDCARD : pattern;
		
		if (!this.handlers.has(key)) {
			this.handlers.set(key, new Set());
		}

		const handlers = this.handlers.get(key)!;
		const wrappedHandler = typeof pattern === 'function'
			? ((event: SrubaEvent) => pattern(event) ? handler(event) : Promise.resolve())
			: handler;

		handlers.add(wrappedHandler);

		return () => {
			handlers.delete(wrappedHandler);
			if (handlers.size === 0) {
				this.handlers.delete(key);
			}
		};
	}

	clear(): void {
		this.handlers.clear();
		this.eventStore.clear();
	}
}