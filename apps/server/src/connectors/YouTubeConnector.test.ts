import { describe, expect, it } from 'vitest';
import { normalizeYouTubeLiveChatItem, parseYouTubeVideoId } from './YouTubeConnector';

describe('YouTubeConnector', () => {
  it('reads common YouTube LIVE URL formats', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=abcdefghijk')).toBe('abcdefghijk');
    expect(parseYouTubeVideoId('https://youtu.be/abcdefghijk')).toBe('abcdefghijk');
    expect(parseYouTubeVideoId('https://www.youtube.com/live/abcdefghijk')).toBe('abcdefghijk');
  });

  it('maps a real chat author, avatar and message', () => {
    const event = normalizeYouTubeLiveChatItem({
      id: 'message-1',
      snippet: {
        type: 'textMessageEvent',
        publishedAt: '2026-11-03T01:00:00Z',
        textMessageDetails: { messageText: 'Nam mô A Di Đà Phật' },
      },
      authorDetails: {
        channelId: 'UC-real-viewer',
        displayName: 'Phật tử YouTube',
        profileImageUrl: 'https://yt3.ggpht.com/avatar.jpg',
      },
    });

    expect(event).toMatchObject({
      source: 'YOUTUBE',
      type: 'COMMENT',
      user: {
        id: 'youtube:UC-real-viewer',
        nickname: 'Phật tử YouTube',
        avatarUrl: 'https://yt3.ggpht.com/avatar.jpg',
      },
      comment: 'Nam mô A Di Đà Phật',
    });
  });

  it('maps Super Chat to a real gift event', () => {
    const event = normalizeYouTubeLiveChatItem({
      id: 'message-2',
      snippet: {
        type: 'superChatEvent',
        superChatDetails: { amountDisplayString: '50.000 ₫' },
      },
      authorDetails: { channelId: 'UC-donor', displayName: 'Người ủng hộ' },
    });

    expect(event).toMatchObject({
      source: 'YOUTUBE',
      type: 'GIFT',
      gift: { name: 'YouTube Super Chat 50.000 ₫', quantity: 1 },
    });
  });
});
