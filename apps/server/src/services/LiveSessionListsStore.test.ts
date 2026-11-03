import { describe, expect, it } from 'vitest';
import type { LiveEvent } from '@live/shared';
import type { UserCharacter } from './CharacterStore';
import { LiveSessionListsStore } from './LiveSessionListsStore';

function createCharacter(isSimulated: boolean): UserCharacter {
  return {
    userId: isSimulated ? 'sim-user' : 'real-user',
    username: isSimulated ? 'sim_user' : 'real_user',
    nickname: isSimulated ? 'Người giả lập' : 'Phật tử thật',
    isSimulated,
    gender: 'female',
    meritPoints: 100,
    level: 5,
    rankName: 'Khách hành hương',
    likeCountInSession: 0,
    lastCommentAt: 0,
    shareCountToday: 0,
    followAwarded: 0,
    joinAwardedToday: 0,
    watchTimeAwardedToday: 0,
    lastActiveAt: 1,
    createdAt: 1,
  };
}

function createGiftEvent(source: LiveEvent['source']): LiveEvent {
  return {
    id: `${source}-gift`,
    source,
    type: 'GIFT',
    user: { id: 'user', username: 'user', nickname: 'User' },
    gift: { name: 'Rose', quantity: 2 },
    timestamp: 1,
  };
}

describe('LiveSessionListsStore', () => {
  it('keeps real lists only in memory and rejects simulator events', () => {
    const store = new LiveSessionListsStore();
    store.recordEvent(createGiftEvent('SIMULATOR'), createCharacter(true), 20);
    store.recordEvent(createGiftEvent('YOUTUBE'), createCharacter(false), 20);

    expect(store.snapshot().merit).toHaveLength(1);
    expect(store.snapshot().donors).toHaveLength(1);

    store.reset();
    expect(store.snapshot()).toEqual({ merit: [], donors: [] });
  });
});
