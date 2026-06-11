import type { DomainEvent } from './types.js';

type Handler = (event: DomainEvent) => void | Promise<void>;

/**
 * In-memory event bus — thay Kafka/SQS trong demo.
 * Có thể simulate at-least-once bằng duplicate delivery.
 */
export class EventBus {
  private handlers = new Map<string, Handler[]>();
  private history: DomainEvent[] = [];

  subscribe(eventType: string, handler: Handler) {
    const list = this.handlers.get(eventType) ?? [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  async publish(event: DomainEvent, options?: { duplicate?: boolean }) {
    this.history.push(event);
    const handlers = this.handlers.get(event.eventType) ?? [];

    for (const handler of handlers) {
      await handler(event);
      if (options?.duplicate) {
        console.log(`  [bus] 🔁 duplicate delivery: ${event.eventType} (${event.eventId})`);
        await handler(event);
      }
    }
  }

  getHistory() {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
  }

  /** Gọi trước mỗi scenario — tránh subscribe chồng handler */
  reset() {
    this.handlers.clear();
    this.history = [];
  }
}

export const eventBus = new EventBus();
