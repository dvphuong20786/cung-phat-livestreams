import { describe, expect, it } from 'vitest';
import { EventService } from './EventService';

describe('events/stats', () => {
  it('counts likes and simulation', () => {
    const service = new EventService();
    service.simulate({ type: 'LIKE', username: 'u', nickname: 'U', likeCount: 10 });
    expect(service.stats.snapshot().simulated.likes).toBe(10);
  });

  it('counts finalized gift once', () => {
    const service = new EventService();
    service.simulate({
      type: 'GIFT',
      username: 'u',
      nickname: 'U',
      gift: { name: 'Rose', quantity: 3, repeatEnd: true },
    });
    expect(service.stats.snapshot().simulated.giftQuantity).toBe(3);
    expect(service.stats.snapshot().simulated.giftEvents).toBe(1);
  });

  it('combines real statistics from all connected platforms', () => {
    const service = new EventService();
    service.process({
      id: 'youtube-1',
      source: 'YOUTUBE',
      type: 'COMMENT',
      user: { id: 'youtube:user-1', username: 'user-1', nickname: 'YouTube user' },
      comment: 'Xin chào',
      timestamp: Date.now(),
    });
    service.process({
      id: 'facebook-1',
      source: 'FACEBOOK',
      type: 'COMMENT',
      user: { id: 'facebook:user-1', username: 'user-1', nickname: 'Facebook user' },
      comment: 'Cầu bình an',
      timestamp: Date.now(),
    });

    expect(service.stats.snapshot().real.comments).toBe(2);
    expect(service.stats.snapshot().real.uniqueUsers).toBe(2);
  });
});
