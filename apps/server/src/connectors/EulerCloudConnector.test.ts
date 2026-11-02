import { describe, expect, it } from 'vitest';
import {
  getCloudCloseMessage,
  normalizeCloudMessage,
  readCloudMessages,
} from './EulerCloudConnector';

describe('Euler Cloud WebSocket', () => {
  it('reads bundled messages and normalizes a like', () => {
    const messages = readCloudMessages({
      messages: [
        {
          type: 'WebcastLikeMessage',
          data: {
            likeCount: 12,
            user: { userId: '1', uniqueId: 'thien_tam', nickname: 'Thiện Tâm' },
          },
        },
      ],
    });
    expect(messages).toHaveLength(1);
    expect(normalizeCloudMessage(messages[0]!)).toMatchObject({
      type: 'LIKE',
      likeCount: 12,
      user: { username: 'thien_tam' },
    });
  });
  it('ignores a running gift streak and emits its final quantity', () => {
    const running = {
      type: 'WebcastGiftMessage',
      data: {
        repeatCount: 2,
        repeatEnd: 0,
        giftId: 5655,
        giftDetails: { type: 1, name: 'Rose' },
        user: { uniqueId: 'phat_tu' },
      },
    };
    expect(normalizeCloudMessage(running)).toBeNull();
    expect(
      normalizeCloudMessage({
        ...running,
        data: { ...running.data, repeatCount: 5, repeatEnd: 1 },
      }),
    ).toMatchObject({ type: 'GIFT', gift: { name: 'Rose', quantity: 5, repeatEnd: true } });
  });
  it('explains quota and offline close codes', () => {
    expect(getCloudCloseMessage(4429)).toContain('dừng tự reconnect');
    expect(getCloudCloseMessage(4404)).toContain('không phát LIVE');
  });
});
