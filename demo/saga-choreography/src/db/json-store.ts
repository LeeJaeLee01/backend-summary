import fs from 'node:fs';
import path from 'node:path';

export type OutboxRow = {
  id: number;
  event_id: string;
  event_type: string;
  aggregate_id: string;
  payload: string;
  created_at: string;
  published_at: string | null;
};

export type ProcessedEvent = {
  event_id: string;
  event_type: string;
  processed_at: string;
};

export type StoreData = {
  outbox: OutboxRow[];
  processed_events: ProcessedEvent[];
  [key: string]: unknown;
};

export class JsonStore {
  private data: StoreData;
  private nextOutboxId = 1;

  constructor(private readonly filePath: string, initial: StoreData) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (fs.existsSync(filePath)) {
      this.data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as StoreData;
      const maxId = this.data.outbox.reduce((m, r) => Math.max(m, r.id), 0);
      this.nextOutboxId = maxId + 1;
    } else {
      this.data = structuredClone(initial);
      this.flush();
    }
  }

  get<T>(table: string): T[] {
    return (this.data[table] as T[]) ?? [];
  }

  transaction(fn: () => void) {
    fn();
    this.flush();
  }

  flush() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  insertOutbox(event: {
    eventId: string;
    eventType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }) {
    this.data.outbox.push({
      id: this.nextOutboxId++,
      event_id: event.eventId,
      event_type: event.eventType,
      aggregate_id: event.aggregateId,
      payload: JSON.stringify(event.payload),
      created_at: new Date().toISOString(),
      published_at: null,
    });
  }

  getUnpublishedOutbox(limit = 20): OutboxRow[] {
    return this.data.outbox
      .filter((r) => r.published_at === null)
      .sort((a, b) => a.id - b.id)
      .slice(0, limit);
  }

  markOutboxPublished(id: number) {
    const row = this.data.outbox.find((r) => r.id === id);
    if (row) row.published_at = new Date().toISOString();
  }

  /** true = event mới, cần xử lý */
  tryConsumeInbox(eventId: string, eventType: string): boolean {
    if (this.data.processed_events.some((e) => e.event_id === eventId)) return false;
    this.data.processed_events.push({
      event_id: eventId,
      event_type: eventType,
      processed_at: new Date().toISOString(),
    });
    this.flush();
    return true;
  }

  countUnpublishedOutbox(): number {
    return this.data.outbox.filter((r) => r.published_at === null).length;
  }
}
