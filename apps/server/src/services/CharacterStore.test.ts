import { describe, expect, it } from 'vitest';
import type { LiveEvent, LiveEventType } from '@live/shared';
import { CharacterStore } from './CharacterStore';

function createEvent(
  type: LiveEventType,
  username = 'old_username',
  source: LiveEvent['source'] = 'TIKTOK',
): LiveEvent {
  return {
    id: `${type}-${username}`,
    source,
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
    expect(characterAfterReset?.likeCountInSession).toBe(0);
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

  it('uses the existing character when a comment has a different user id', () => {
    const characterStore = new CharacterStore(':memory:');
    const joinEvent = createEvent('JOIN');
    joinEvent.user.avatarUrl = 'https://p16-sign.tiktokcdn.com/avatar.jpeg';
    characterStore.awardPointsForEvent(joinEvent);

    const commentEvent = createEvent('COMMENT');
    commentEvent.user.id = 'comment-user-id';
    const { character } = characterStore.awardPointsForEvent(commentEvent);

    expect(character.userId).toBe('user-1');
    expect(character.avatarUrl).toBe('https://p16-sign.tiktokcdn.com/avatar.jpeg');
    expect(characterStore.getAllCharacters()).toHaveLength(1);
    expect(characterStore.getCharacter('user-1')?.meritPoints).toBe(10);
    characterStore.close();
  });

  it('returns only real TikTok characters for the merit leaderboard', () => {
    const characterStore = new CharacterStore(':memory:');
    characterStore.awardPointsForEvent(createEvent('GIFT', 'real_user'));

    const simulatedEvent = createEvent('GIFT', 'test_user', 'SIMULATOR');
    simulatedEvent.user.id = 'simulated-user-id';
    characterStore.awardPointsForEvent(simulatedEvent);

    expect(characterStore.getAllCharacters()).toHaveLength(2);
    expect(characterStore.getRealCharacters()).toHaveLength(1);
    expect(characterStore.getRealCharacters()[0]?.username).toBe('real_user');
    characterStore.close();
  });

  it('awards points for rapid consecutive interactions without cooldown limits', () => {
    const characterStore = new CharacterStore(':memory:');
    // 2 comment gửi liên tiếp nhanh cùng lúc
    characterStore.awardPointsForEvent(createEvent('COMMENT', 'rapid_user'));
    const { character } = characterStore.awardPointsForEvent(createEvent('COMMENT', 'rapid_user'));

    // Cả 2 comment đều được tính điểm (+5 x 2 = 10 điểm), không bị chặn 30s
    expect(character.meritPoints).toBe(10);
    characterStore.close();
  });

  it('awards 20 points for continuous 5-minute watch time', () => {
    const characterStore = new CharacterStore(':memory:');
    characterStore.awardPointsForEvent(createEvent('JOIN', 'watch_user'));
    const initialPoints = characterStore.getCharacter('user-1')?.meritPoints ?? 0;
    expect(initialPoints).toBe(5);

    const result = characterStore.awardWatchTime('user-1');
    expect(result?.pointsAwarded).toBe(20);
    expect(result?.character.meritPoints).toBe(25);
    characterStore.close();
  });

  it('only awards likes when each group of 10 is completed', () => {
    const characterStore = new CharacterStore(':memory:');
    const firstLikes = createEvent('LIKE', 'like_user');
    firstLikes.likeCount = 7;
    const secondLikes = createEvent('LIKE', 'like_user');
    secondLikes.likeCount = 2;
    const completedGroup = createEvent('LIKE', 'like_user');
    completedGroup.likeCount = 1;

    expect(characterStore.awardPointsForEvent(firstLikes).pointsAwarded).toBe(0);
    expect(characterStore.awardPointsForEvent(secondLikes).pointsAwarded).toBe(0);
    expect(characterStore.awardPointsForEvent(completedGroup).pointsAwarded).toBe(3);
    expect(characterStore.getCharacter('user-1')?.likeCountInSession).toBe(10);
    characterStore.close();
  });

  it('awards a non-flower gift from its coin tier', () => {
    const characterStore = new CharacterStore(':memory:');
    const giftEvent = createEvent('GIFT', 'gift_user');
    giftEvent.gift = {
      name: 'TikTok Universe',
      quantity: 2,
      coinValue: 500,
      repeatEnd: true,
    };

    const result = characterStore.awardPointsForEvent(giftEvent);

    expect(result.pointsAwarded).toBe(1_200);
    expect(result.character.meritPoints).toBe(1_200);
    characterStore.close();
  });
});
