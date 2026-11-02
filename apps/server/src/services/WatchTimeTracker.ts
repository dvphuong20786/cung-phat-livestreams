export const WATCH_TIME_INTERVAL_MS = 5 * 60_000;

export class WatchTimeTracker {
  private readonly nextAwardAtByUserId = new Map<string, number>();

  public startWatching(userId: string, joinedAt = Date.now()): void {
    if (this.nextAwardAtByUserId.has(userId)) return;
    this.nextAwardAtByUserId.set(userId, joinedAt + WATCH_TIME_INTERVAL_MS);
  }

  public collectDueUserIds(now = Date.now()): string[] {
    const dueUserIds: string[] = [];

    for (const [userId, nextAwardAt] of this.nextAwardAtByUserId) {
      let followingAwardAt = nextAwardAt;
      while (now >= followingAwardAt) {
        dueUserIds.push(userId);
        followingAwardAt += WATCH_TIME_INTERVAL_MS;
      }
      this.nextAwardAtByUserId.set(userId, followingAwardAt);
    }

    return dueUserIds;
  }

  public clear(): void {
    this.nextAwardAtByUserId.clear();
  }
}
