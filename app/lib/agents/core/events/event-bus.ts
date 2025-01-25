import { SrubaEvent, EventHandler, EventFilter, EventType } from '../types';

type TypedEventHandler<T extends SrubaEvent> = (event: T) => Promise<void>;

export class EventBus {
	private handlers: Map<EventType | symbol, Set<TypedEventHandler<any>>>;
	private readonly WILDCARD = Symbol('*');

	constructor() {
		this.handlers = new Map();
	}

	async publish(event: SrubaEvent): Promise<void> {
		const typeHandlers = this.handlers.get(event.type) || new Set();
		const wildcardHandlers = this.handlers.get(this.WILDCARD) || new Set();
		
		const promises = [...typeHandlers, ...wildcardHandlers].map(handler => handler(event));
		await Promise.all(promises);
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
	}
}