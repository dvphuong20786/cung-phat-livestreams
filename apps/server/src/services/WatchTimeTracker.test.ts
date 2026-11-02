import { describe, expect, it } from 'vitest';
import { WATCH_TIME_INTERVAL_MS, WatchTimeTracker } from './WatchTimeTracker';

describe('WatchTimeTracker', () => {
  it('awards every completed continuous 5-minute interval', () => {
    const tracker = new WatchTimeTracker();
    tracker.startWatching('user-1', 1_000);

    expect(tracker.collectDueUserIds(1_000 + WATCH_TIME_INTERVAL_MS - 1)).toEqual([]);
    expect(tracker.collectDueUserIds(1_000 + WATCH_TIME_INTERVAL_MS)).toEqual(['user-1']);
    expect(tracker.collectDueUserIds(1_000 + WATCH_TIME_INTERVAL_MS * 3)).toEqual([
      'user-1',
      'user-1',
    ]);
  });

  it('stops tracking viewers when the live session ends', () => {
    const tracker = new WatchTimeTracker();
    tracker.startWatching('user-1', 1_000);
    tracker.clear();

    expect(tracker.collectDueUserIds(1_000 + WATCH_TIME_INTERVAL_MS)).toEqual([]);
  });
});
