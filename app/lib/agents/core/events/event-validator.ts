import { SrubaEvent, EventType } from '../types/event-types';
import { AgentError, ErrorSeverity } from '../errors/error-types';

export class EventValidationError extends AgentError {
	constructor(message: string, event: SrubaEvent) {
		super(
			message,
			event.source,
			ErrorSeverity.HIGH,
			true,
			{
				timestamp: Date.now(),
				location: 'EventValidator',
				metadata: { event }
			}
		);
	}
}

export class EventValidator {
	validate(event: SrubaEvent): void {
		if (!event.id || !event.type || !event.timestamp || !event.source) {
			throw new EventValidationError('Missing required event fields', event);
		}

		if (event.timestamp > Date.now()) {
			throw new EventValidationError('Event timestamp is in the future', event);
		}

		this.validateEventType(event);
	}

	private validateEventType(event: SrubaEvent): void {
		if (!Object.values(EventType).includes(event.type)) {
			throw new EventValidationError(`Invalid event type: ${event.type}`, event);
		}
	}
}