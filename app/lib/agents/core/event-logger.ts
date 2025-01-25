import { SrubaEvent, EventType } from './types';
import { EventBus } from './events';

export class EventLogger {
	private logs: SrubaEvent[] = [];
	private maxLogs: number = 1000;

	constructor(private eventBus: EventBus) {
		this.setupSubscriptions();
	}

	private setupSubscriptions(): void {
		this.eventBus.subscribe(
			(event: SrubaEvent): event is SrubaEvent => true,
			this.logEvent
		);
	}

	private logEvent = async (event: SrubaEvent): Promise<void> => {
		this.logs.push(event);
		if (this.logs.length > this.maxLogs) {
			this.logs.shift();
		}
		console.log(`[${event.type}] ${new Date(event.timestamp).toISOString()}`, event);
	};

	getRecentLogs(count: number = 100): SrubaEvent[] {
		return this.logs.slice(-count);
	}

	getLogsByType(type: EventType): SrubaEvent[] {
		return this.logs.filter(event => event.type === type);
	}

	clear(): void {
		this.logs = [];
	}
}