import { EventEmitter } from 'node:events';
import type { ConnectionStatus, LiveEvent } from '@live/shared';

interface FacebookComment {
  id?: string;
  message?: string;
  created_time?: string;
  from?: {
    id?: string;
    name?: string;
    picture?: { data?: { url?: string } };
  };
}

interface FacebookCommentsResponse {
  data?: FacebookComment[];
  error?: { message?: string };
}

export class FacebookConnector extends EventEmitter {
  public status: ConnectionStatus = { state: 'DISCONNECTED', reconnectAttempt: 0 };
  private pollTimer?: ReturnType<typeof setTimeout>;
  private runId = 0;
  private videoId?: string;
  private connectedSinceSeconds = 0;
  private readonly seenCommentIds = new Set<string>();

  public async connect(liveUrl: string): Promise<void> {
    await this.disconnect(false);
    const videoId = parseFacebookLiveVideoId(liveUrl);
    if (!videoId) {
      throw new Error('URL Facebook LIVE phải chứa video ID, ví dụ /videos/123456789');
    }

    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
    if (!accessToken) throw new Error('Server chưa cấu hình FACEBOOK_PAGE_ACCESS_TOKEN');

    this.videoId = videoId;
    this.connectedSinceSeconds = Math.floor(Date.now() / 1000);
    this.setStatus({ state: 'CONNECTING', username: videoId, error: undefined });
    const currentRunId = ++this.runId;

    try {
      await this.poll(currentRunId, accessToken, true);
      if (currentRunId === this.runId) {
        this.setStatus({ state: 'CONNECTED', connectedAt: Date.now(), error: undefined });
      }
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }

  public async disconnect(updateStatus = true): Promise<void> {
    this.runId += 1;
    clearTimeout(this.pollTimer);
    this.pollTimer = undefined;
    this.videoId = undefined;
    this.seenCommentIds.clear();
    if (updateStatus) {
      this.setStatus({
        state: 'DISCONNECTED',
        connectedAt: undefined,
        error: undefined,
        username: undefined,
      });
    }
  }

  private async poll(runId: number, accessToken: string, isInitialRequest = false): Promise<void> {
    if (runId !== this.runId || !this.videoId) return;

    const graphVersion = process.env.FACEBOOK_GRAPH_VERSION?.trim();
    const graphBaseUrl = graphVersion
      ? `https://graph.facebook.com/${graphVersion}`
      : 'https://graph.facebook.com';
    const commentsUrl = new URL(`${graphBaseUrl}/${this.videoId}/comments`);
    commentsUrl.search = new URLSearchParams({
      fields: 'id,message,created_time,from{id,name,picture{url}}',
      order: 'chronological',
      filter: 'stream',
      since: String(this.connectedSinceSeconds),
      limit: '100',
      access_token: accessToken,
    }).toString();

    const response = await fetch(commentsUrl);
    const payload = (await response.json()) as FacebookCommentsResponse;
    if (!response.ok)
      throw new Error(payload.error?.message || 'Không đọc được bình luận Facebook LIVE');
    if (runId !== this.runId) return;

    for (const comment of payload.data ?? []) {
      if (!comment.id || this.seenCommentIds.has(comment.id)) continue;
      this.seenCommentIds.add(comment.id);
      const event = normalizeFacebookComment(comment);
      if (event) this.emit('event', event);
    }

    this.pollTimer = setTimeout(
      () => void this.poll(runId, accessToken).catch((error) => this.fail(error)),
      3_000,
    );
    this.pollTimer.unref();

    if (isInitialRequest) return;
  }

  private setStatus(status: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...status, reconnectAttempt: 0 };
    this.emit('status', this.status);
  }

  private fail(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.runId += 1;
    clearTimeout(this.pollTimer);
    this.setStatus({ state: 'ERROR', error: message });
    this.emit('error-safe', message);
  }
}

export function parseFacebookLiveVideoId(input: string): string | null {
  try {
    const url = new URL(input.trim());
    const hostname = url.hostname.toLocaleLowerCase().replace(/^www\./, '');
    if (hostname !== 'facebook.com' && hostname !== 'm.facebook.com' && hostname !== 'fb.watch') {
      return null;
    }

    const queryVideoId = url.searchParams.get('v');
    if (queryVideoId && /^\d{5,30}$/.test(queryVideoId)) return queryVideoId;
    const pathMatch = url.pathname.match(/\/(?:videos|live\/videos)\/(\d{5,30})/);
    return pathMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

export function normalizeFacebookComment(comment: FacebookComment): LiveEvent | null {
  const commentId = comment.id?.trim();
  const userId = comment.from?.id?.trim();
  const nickname = comment.from?.name?.trim();
  const message = comment.message?.trim();
  if (!commentId || !userId || !nickname || !message) return null;

  return {
    id: `facebook:${commentId}`,
    source: 'FACEBOOK',
    type: 'COMMENT',
    user: {
      id: `facebook:${userId}`,
      username: userId,
      nickname,
      avatarUrl: comment.from?.picture?.data?.url,
    },
    comment: message,
    timestamp: Date.parse(comment.created_time ?? '') || Date.now(),
  };
}
