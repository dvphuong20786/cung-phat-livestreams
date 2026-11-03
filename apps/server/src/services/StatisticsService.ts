import {
  realEventSources,
  type EventSource,
  type LiveEvent,
  type SourceStats,
  type Statistics,
} from '@live/shared';

const allEventSources: EventSource[] = [...realEventSources, 'SIMULATOR'];

function createEmptyStats(): SourceStats {
  return {
    likes: 0,
    giftQuantity: 0,
    giftEvents: 0,
    comments: 0,
    follows: 0,
    shares: 0,
    joins: 0,
    uniqueUsers: 0,
    eventRate: 0,
  };
}

function sumStats(sourceStats: SourceStats[]): SourceStats {
  return {
    likes: sourceStats.reduce((total, stats) => total + stats.likes, 0),
    giftQuantity: sourceStats.reduce((total, stats) => total + stats.giftQuantity, 0),
    giftEvents: sourceStats.reduce((total, stats) => total + stats.giftEvents, 0),
    comments: sourceStats.reduce((total, stats) => total + stats.comments, 0),
    follows: sourceStats.reduce((total, stats) => total + stats.follows, 0),
    shares: sourceStats.reduce((total, stats) => total + stats.shares, 0),
    joins: sourceStats.reduce((total, stats) => total + stats.joins, 0),
    uniqueUsers: 0,
    eventRate: Number(sourceStats.reduce((total, stats) => total + stats.eventRate, 0).toFixed(1)),
    lastEventTimestamp:
      Math.max(...sourceStats.map((stats) => stats.lastEventTimestamp ?? 0)) || undefined,
  };
}

export class StatisticsService {
  private readonly stats = Object.fromEntries(
    allEventSources.map((source) => [source, createEmptyStats()]),
  ) as Record<EventSource, SourceStats>;
  private readonly users = Object.fromEntries(
    allEventSources.map((source) => [source, new Set<string>()]),
  ) as Record<EventSource, Set<string>>;
  private readonly eventTimes = Object.fromEntries(
    allEventSources.map((source) => [source, [] as number[]]),
  ) as Record<EventSource, number[]>;

  public add(event: LiveEvent): void {
    const stats = this.stats[event.source];
    const userId = event.user.id || event.user.username;
    this.users[event.source].add(userId);
    stats.uniqueUsers = this.users[event.source].size;

    if (event.type === 'LIKE') stats.likes += event.likeCount ?? 1;
    if (event.type === 'GIFT') {
      stats.giftQuantity += event.gift?.quantity ?? 1;
      stats.giftEvents += 1;
    }
    if (event.type === 'COMMENT') stats.comments += 1;
    if (event.type === 'FOLLOW') stats.follows += 1;
    if (event.type === 'SHARE') stats.shares += 1;
    if (event.type === 'JOIN') stats.joins += 1;

    stats.lastEventTimestamp = event.timestamp;
    const cutoff = Date.now() - 5000;
    this.eventTimes[event.source].push(event.timestamp);
    this.eventTimes[event.source] = this.eventTimes[event.source].filter(
      (timestamp) => timestamp >= cutoff,
    );
    stats.eventRate = Number((this.eventTimes[event.source].length / 5).toFixed(1));
  }

  public reset(source?: EventSource): void {
    if (!source) {
      allEventSources.forEach((eventSource) => this.reset(eventSource));
      return;
    }

    this.stats[source] = createEmptyStats();
    this.users[source].clear();
    this.eventTimes[source] = [];
  }

  public snapshot(): Statistics {
    const real = sumStats(realEventSources.map((source) => this.stats[source]));
    const simulated = { ...this.stats.SIMULATOR };
    const total = sumStats([real, simulated]);

    const realUserIds = new Set(realEventSources.flatMap((source) => [...this.users[source]]));
    real.uniqueUsers = realUserIds.size;
    total.uniqueUsers = new Set([...realUserIds, ...this.users.SIMULATOR]).size;

    return { real, simulated, total };
  }
}
