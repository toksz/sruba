import { StoredEvent } from './event-store';
import fs from 'fs/promises';
import path from 'path';

export class EventPersistence {
	private readonly storePath: string;
	private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
	private currentFile: number = 0;

	constructor(storePath: string) {
		this.storePath = storePath;
	}

	async initialize(): Promise<void> {
		await fs.mkdir(this.storePath, { recursive: true });
	}

	async saveEvent(event: StoredEvent): Promise<void> {
		const fileName = path.join(this.storePath, `events_${this.currentFile}.json`);
		const eventString = JSON.stringify(event) + '\n';

		try {
			const stats = await fs.stat(fileName).catch(() => null);
			if (stats && stats.size >= this.maxFileSize) {
				this.currentFile++;
			}
			await fs.appendFile(fileName, eventString);
		} catch (error) {
			throw new Error(`Failed to persist event: ${error}`);
		}
	}

	async loadEvents(fromSequence?: number): Promise<StoredEvent[]> {
		const events: StoredEvent[] = [];
		const files = await fs.readdir(this.storePath);
		
		for (const file of files.sort()) {
			const content = await fs.readFile(path.join(this.storePath, file), 'utf-8');
			const fileEvents = content.split('\n')
				.filter(line => line.trim())
				.map(line => JSON.parse(line) as StoredEvent)
				.filter(event => !fromSequence || event.sequence > fromSequence);
			events.push(...fileEvents);
		}

		return events;
	}
}