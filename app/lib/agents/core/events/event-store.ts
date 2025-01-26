import { SrubaEvent, EventType } from '../types/event-types';
import { EventPersistence } from './event-persistence';

export interface StoredEvent extends SrubaEvent {
	sequence: number;
	metadata?: {
		retries?: number;
		errors?: Error[];
	};
}

export class EventStore {
	private events: StoredEvent[] = [];
	private currentSequence: number = 0;
	private readonly maxEvents: number = 10000;
	private persistence: EventPersistence;

	constructor(storePath: string) {
		this.persistence = new EventPersistence(storePath);
	}

	async initialize(): Promise<void> {
		await this.persistence.initialize();
		const events = await this.persistence.loadEvents();
		this.events = events;
		this.currentSequence = events.length > 0 ? 
			Math.max(...events.map(e => e.sequence)) : 0;
	}

	async store(event: SrubaEvent): Promise<StoredEvent> {
		const storedEvent: StoredEvent = {
			...event,
			sequence: ++this.currentSequence,
			metadata: {}
		};

		await this.persistence.saveEvent(storedEvent);
		this.events.push(storedEvent);
		if (this.events.length > this.maxEvents) {
			this.events.shift();
		}

		return storedEvent;
	}

	getEvents(fromSequence?: number): StoredEvent[] {
		if (fromSequence === undefined) return [...this.events];
		return this.events.filter(e => e.sequence > fromSequence);
	}

	getEventsByType(type: EventType): StoredEvent[] {
		return this.events.filter(e => e.type === type);
	}

	clear(): void {
		this.events = [];
		this.currentSequence = 0;
	}
}