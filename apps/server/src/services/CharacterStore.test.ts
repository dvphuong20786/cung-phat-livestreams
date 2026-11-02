import { describe, expect, it } from 'vitest';
import type { LiveEvent, LiveEventType } from '@live/shared';
import { CharacterStore } from './CharacterStore';

function createEvent(type: LiveEventType, username = 'old_username'): LiveEvent {
  return {
    id: `${type}-${username}`,
    source: 'TIKTOK',
    type,
    user: {
      id: 'user-1',
      username,
      nickname: 'Phật tử An',
    },
    likeCount: type === 'LIKE' ? 10 : undefined,
    timestamp: Date.now(),
  };
}

describe('CharacterStore', () => {
  it('starts a new live quota without losing persistent character progress', () => {
    const characterStore = new CharacterStore(':memory:');
    characterStore.awardPointsForEvent(createEvent('LIKE'));
    characterStore.awardPointsForEvent(createEvent('SHARE'));
    characterStore.awardPointsForEvent(createEvent('JOIN'));
    characterStore.awardPointsForEvent(createEvent('FOLLOW'));

    const characterBeforeReset = characterStore.getCharacter('user-1');
    characterStore.resetLiveSessionLimits();
    const characterAfterReset = characterStore.getCharacter('user-1');

    expect(characterAfterReset?.meritPoints).toBe(characterBeforeReset?.meritPoints);
    expect(characterAfterReset?.level).toBe(characterBeforeReset?.level);
    expect(characterAfterReset?.rankName).toBe(characterBeforeReset?.rankName);
    expect(characterAfterReset?.followAwarded).toBe(1);
    expect(characterAfterReset?.likePointsToday).toBe(0);
    expect(characterAfterReset?.lastCommentAt).toBe(0);
    expect(characterAfterReset?.shareCountToday).toBe(0);
    expect(characterAfterReset?.joinAwardedToday).toBe(0);
    expect(characterAfterReset?.watchTimeAwardedToday).toBe(0);
    characterStore.close();
  });

  it('persists a changed username for the same TikTok user id', () => {
    const characterStore = new CharacterStore(':memory:');
    characterStore.awardPointsForEvent(createEvent('JOIN'));

    characterStore.awardPointsForEvent(createEvent('COMMENT', 'new_username'));

    expect(characterStore.getCharacter('user-1')?.username).toBe('new_username');
    characterStore.close();
  });
});
