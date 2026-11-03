import { describe, expect, it } from 'vitest';
import { normalizeFacebookComment, parseFacebookLiveVideoId } from './FacebookConnector';

describe('FacebookConnector', () => {
  it('reads a Facebook Page LIVE video URL', () => {
    expect(
      parseFacebookLiveVideoId('https://www.facebook.com/chua.anlac/videos/123456789012345'),
    ).toBe('123456789012345');
    expect(parseFacebookLiveVideoId('https://www.facebook.com/watch/?v=123456789012345')).toBe(
      '123456789012345',
    );
  });

  it('maps only comments with a real Facebook identity', () => {
    const event = normalizeFacebookComment({
      id: 'comment-1',
      message: 'Cầu bình an',
      created_time: '2026-11-03T01:00:00Z',
      from: {
        id: 'facebook-user-1',
        name: 'Phật tử Facebook',
        picture: { data: { url: 'https://graph.facebook.com/avatar.jpg' } },
      },
    });

    expect(event).toMatchObject({
      source: 'FACEBOOK',
      type: 'COMMENT',
      user: { id: 'facebook:facebook-user-1', nickname: 'Phật tử Facebook' },
      comment: 'Cầu bình an',
    });
    expect(normalizeFacebookComment({ id: 'comment-2', message: 'Không có danh tính' })).toBeNull();
  });
});
