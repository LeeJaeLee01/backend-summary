import type { JsonStore } from './db/json-store.js';
import { eventBus } from './event-bus.js';
import type { DomainEvent } from './types.js';

export class OutboxRelay {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly sources: { name: string; store: JsonStore }[]) {}

  start(intervalMs: number) {
    this.timer = setInterval(() => this.poll(), intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async pollOnce(serviceName?: string) {
    for (const source of this.sources) {
      if (serviceName && source.name !== serviceName) continue;
      await this.pollStore(source.name, source.store);
    }
  }

  private async poll() {
    for (const source of this.sources) {
      await this.pollStore(source.name, source.store);
    }
  }

  private async pollStore(serviceName: string, store: JsonStore) {
    const rows = store.getUnpublishedOutbox();

    for (const row of rows) {
      const event: DomainEvent = {
        eventId: row.event_id,
        eventType: row.event_type,
        aggregateId: row.aggregate_id,
        payload: JSON.parse(row.payload) as Record<string, unknown>,
        occurredAt: new Date().toISOString(),
      };

      console.log(`  [outbox:${serviceName}] publish → ${event.eventType} (${event.eventId})`);
      await eventBus.publish(event);

      store.markOutboxPublished(row.id);
      store.flush();
    }
  }
}
