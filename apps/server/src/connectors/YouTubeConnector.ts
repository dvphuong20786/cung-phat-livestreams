import { EventEmitter } from 'node:events';
import type { ConnectionStatus, LiveEvent } from '@live/shared';

interface YouTubeLiveChatItem {
  id?: string;
  snippet?: {
    type?: string;
    publishedAt?: string;
    displayMessage?: string;
    textMessageDetails?: { messageText?: string };
    superChatDetails?: { amountDisplayString?: string; userComment?: string };
    superStickerDetails?: { amountDisplayString?: string };
  };
  authorDetails?: {
    channelId?: string;
    displayName?: string;
    profileImageUrl?: string;
  };
}

interface YouTubeLiveChatResponse {
  items?: YouTubeLiveChatItem[];
  nextPageToken?: string;
  pollingIntervalMillis?: number;
  offlineAt?: string;
  error?: { message?: string };
}

export class YouTubeConnector extends EventEmitter {
  public status: ConnectionStatus = { state: 'DISCONNECTED', reconnectAttempt: 0 };
  private pollTimer?: ReturnType<typeof setTimeout>;
  private runId = 0;
  private liveChatId?: string;
  private nextPageToken?: string;
  private readonly seenMessageIds = new Set<string>();

  public async connect(liveUrl: string): Promise<void> {
    await this.disconnect(false);
    const videoId = parseYouTubeVideoId(liveUrl);
    if (!videoId) throw new Error('URL YouTube LIVE không hợp lệ hoặc không chứa video ID');

    const apiKey = process.env.YOUTUBE_API_KEY?.trim();
    if (!apiKey) throw new Error('Server chưa cấu hình YOUTUBE_API_KEY');

    this.setStatus({ state: 'CONNECTING', username: videoId, error: undefined });
    const currentRunId = ++this.runId;

    try {
      const videoUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      videoUrl.search = new URLSearchParams({
        part: 'liveStreamingDetails',
        id: videoId,
        key: apiKey,
      }).toString();
      const response = await fetch(videoUrl);
      const payload = (await response.json()) as {
        items?: Array<{ liveStreamingDetails?: { activeLiveChatId?: string } }>;
        error?: { message?: string };
      };
      if (!response.ok) throw new Error(payload.error?.message || 'YouTube API từ chối kết nối');

      const liveChatId = payload.items?.[0]?.liveStreamingDetails?.activeLiveChatId;
      if (!liveChatId) {
        throw new Error('Video chưa phát LIVE, đã tắt chat hoặc LIVE đã kết thúc');
      }

      this.liveChatId = liveChatId;
      this.setStatus({ state: 'CONNECTED', connectedAt: Date.now(), error: undefined });
      await this.poll(currentRunId, apiKey, true);
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }

  public async disconnect(updateStatus = true): Promise<void> {
    this.runId += 1;
    clearTimeout(this.pollTimer);
    this.pollTimer = undefined;
    this.liveChatId = undefined;
    this.nextPageToken = undefined;
    this.seenMessageIds.clear();
    if (updateStatus) {
      this.setStatus({
        state: 'DISCONNECTED',
        connectedAt: undefined,
        error: undefined,
        username: undefined,
      });
    }
  }

  private async poll(runId: number, apiKey: string, isInitialRequest = false): Promise<void> {
    if (runId !== this.runId || !this.liveChatId) return;

    try {
      const messagesUrl = new URL('https://www.googleapis.com/youtube/v3/liveChat/messages');
      const searchParams: Record<string, string> = {
        liveChatId: this.liveChatId,
        part: 'id,snippet,authorDetails',
        profileImageSize: '88',
        maxResults: '200',
        key: apiKey,
      };
      if (this.nextPageToken) searchParams.pageToken = this.nextPageToken;
      messagesUrl.search = new URLSearchParams(searchParams).toString();

      const response = await fetch(messagesUrl);
      const payload = (await response.json()) as YouTubeLiveChatResponse;
      if (!response.ok)
        throw new Error(payload.error?.message || 'Không đọc được chat YouTube LIVE');
      if (runId !== this.runId) return;

      for (const item of payload.items ?? []) {
        if (!item.id || this.seenMessageIds.has(item.id)) continue;
        this.seenMessageIds.add(item.id);
        const event = normalizeYouTubeLiveChatItem(item);
        if (event) this.emit('event', event);
      }
      this.nextPageToken = payload.nextPageToken;

      if (payload.offlineAt) {
        await this.disconnect();
        return;
      }

      const pollingInterval = Math.max(1_000, payload.pollingIntervalMillis ?? 5_000);
      this.pollTimer = setTimeout(() => void this.poll(runId, apiKey), pollingInterval);
      this.pollTimer.unref();
    } catch (error) {
      if (runId !== this.runId) return;
      this.fail(error);
      if (isInitialRequest) throw error;
    }
  }

  private setStatus(status: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...status, reconnectAttempt: 0 };
    this.emit('status', this.status);
  }

  private fail(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.setStatus({ state: 'ERROR', error: message });
    this.emit('error-safe', message);
  }
}

export function parseYouTubeVideoId(input: string): string | null {
  try {
    const url = new URL(input.trim());
    const hostname = url.hostname.toLocaleLowerCase().replace(/^www\./, '');
    if (hostname === 'youtu.be') return sanitizeYouTubeVideoId(url.pathname.split('/')[1]);
    if (hostname !== 'youtube.com' && hostname !== 'm.youtube.com') return null;

    const queryVideoId = sanitizeYouTubeVideoId(url.searchParams.get('v'));
    if (queryVideoId) return queryVideoId;
    const pathMatch = url.pathname.match(/^\/(?:live|shorts|embed)\/([A-Za-z0-9_-]{6,20})/);
    return sanitizeYouTubeVideoId(pathMatch?.[1]);
  } catch {
    return null;
  }
}

function sanitizeYouTubeVideoId(value?: string | null): string | null {
  const videoId = value?.trim() ?? '';
  return /^[A-Za-z0-9_-]{6,20}$/.test(videoId) ? videoId : null;
}

export function normalizeYouTubeLiveChatItem(item: YouTubeLiveChatItem): LiveEvent | null {
  const messageId = item.id?.trim();
  const channelId = item.authorDetails?.channelId?.trim();
  const nickname = item.authorDetails?.displayName?.trim();
  if (!messageId || !channelId || !nickname) return null;

  const type = item.snippet?.type;
  const user = {
    id: `youtube:${channelId}`,
    username: channelId,
    nickname,
    avatarUrl: item.authorDetails?.profileImageUrl,
  };
  const timestamp = Date.parse(item.snippet?.publishedAt ?? '') || Date.now();

  if (type === 'textMessageEvent') {
    const comment =
      item.snippet?.textMessageDetails?.messageText ?? item.snippet?.displayMessage ?? '';
    if (!comment.trim()) return null;
    return {
      id: `youtube:${messageId}`,
      source: 'YOUTUBE',
      type: 'COMMENT',
      user,
      comment,
      timestamp,
    };
  }

  if (type === 'superChatEvent' || type === 'superStickerEvent') {
    const amount =
      item.snippet?.superChatDetails?.amountDisplayString ??
      item.snippet?.superStickerDetails?.amountDisplayString ??
      '';
    const giftName = type === 'superChatEvent' ? 'YouTube Super Chat' : 'YouTube Super Sticker';
    return {
      id: `youtube:${messageId}`,
      source: 'YOUTUBE',
      type: 'GIFT',
      user,
      gift: { name: amount ? `${giftName} ${amount}` : giftName, quantity: 1, repeatEnd: true },
      timestamp,
    };
  }

  if (
    type === 'newSponsorEvent' ||
    type === 'memberMilestoneChatEvent' ||
    type === 'membershipGiftingEvent' ||
    type === 'giftMembershipReceivedEvent'
  ) {
    return { id: `youtube:${messageId}`, source: 'YOUTUBE', type: 'FOLLOW', user, timestamp };
  }

  return null;
}
