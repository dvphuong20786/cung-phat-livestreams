import { randomUUID } from 'node:crypto';
import {
  simulatorSchema,
  type EventSource,
  type LiveEvent,
  type SimulatorInput,
} from '@live/shared';
import { StatisticsService } from './StatisticsService.js';
import type { EventStore } from './EventStore.js';

export class EventService {
  public readonly stats = new StatisticsService();
  private events: LiveEvent[] = [];

  constructor(
    private readonly limit = 500,
    private readonly store?: EventStore,
  ) {
    this.events = store?.loadRecent(limit) ?? [];
    for (const event of [...this.events].reverse()) this.stats.add(event);
  }

  public process(event: LiveEvent): LiveEvent {
    this.store?.save(event);
    this.events.unshift(event);
    if (this.events.length > this.limit) this.events.length = this.limit;
    this.stats.add(event);
    return event;
  }

  public simulate(input: SimulatorInput): LiveEvent {
    const parsedInput = simulatorSchema.parse(input);
    return this.process({
      id: randomUUID(),
      source: 'SIMULATOR',
      type: parsedInput.type,
      user: { username: parsedInput.username, nickname: parsedInput.nickname },
      likeCount: parsedInput.type === 'LIKE' ? (parsedInput.likeCount ?? 1) : undefined,
      comment: parsedInput.type === 'COMMENT' ? parsedInput.comment : undefined,
      gift: parsedInput.type === 'GIFT' ? parsedInput.gift : undefined,
      timestamp: Date.now(),
    });
  }

  public recent(): LiveEvent[] {
    return [...this.events];
  }

  public clear(source?: EventSource): void {
    this.store?.clear(source);
    this.events = source ? this.events.filter((event) => event.source !== source) : [];
    this.stats.reset(source);
  }
}
