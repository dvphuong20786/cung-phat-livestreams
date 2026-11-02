import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { ControlEvent, TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';
import type { ConnectionStatus, LiveEvent, LiveEventType } from '@live/shared';
export class TikTokConnector extends EventEmitter {
  private conn?: TikTokLiveConnection;
  private timer?: NodeJS.Timeout;
  private explicit = false;
  private attempt = 0;
  private username?: string;
  private auto = true;
  status: ConnectionStatus = { state: 'DISCONNECTED', reconnectAttempt: 0 };
  private set(p: Partial<ConnectionStatus>) {
    this.status = { ...this.status, ...p };
    this.emit('status', this.status);
  }
  async connect(username: string, auto = true) {
    await this.disconnect(false);
    this.explicit = false;
    this.username = username;
    this.auto = auto;
    this.set({
      state: this.attempt ? 'RECONNECTING' : 'CONNECTING',
      username,
      error: undefined,
      reconnectAttempt: this.attempt,
    });
    const signApiKey = process.env.TIKTOK_SIGN_API_KEY?.trim() || undefined;
    const c = new TikTokLiveConnection(username, {
      processInitialData: false,
      enableExtendedGiftInfo: true,
      signApiKey,
    });
    this.conn = c;
    this.bind(c);
    try {
      await c.connect();
      this.attempt = 0;
      this.set({
        state: 'CONNECTED',
        connectedAt: Date.now(),
        reconnectAttempt: 0,
        nextReconnectAt: undefined,
      });
    } catch (error) {
      const message = getTikTokConnectionErrorMessage(error);
      this.fail(new Error(message));
      throw new Error(message);
    }
  }
  private bind(c: TikTokLiveConnection) {
    const on = (name: string, type: LiveEventType, mapper?: (d: any) => Partial<LiveEvent>) =>
      c.on(name as any, (d: any) => {
        if (type === 'GIFT' && d.giftType === 1 && !d.repeatEnd) return;
        const profilePictureUrl = Array.isArray(d.profilePictureUrl)
          ? d.profilePictureUrl[0]
          : d.profilePictureUrl;
        const user = {
          id: String(d.userId ?? '') || undefined,
          username: String(d.uniqueId ?? 'không rõ'),
          nickname: String(d.nickname ?? d.uniqueId ?? 'Không rõ'),
          avatarUrl: typeof profilePictureUrl === 'string' ? profilePictureUrl : undefined,
        };
        this.emit('event', {
          id: randomUUID(),
          source: 'TIKTOK',
          type,
          user,
          timestamp: Date.now(),
          ...mapper?.(d),
        } satisfies LiveEvent);
      });
    on(WebcastEvent.LIKE, 'LIKE', (d) => ({ likeCount: Number(d.likeCount ?? 1) }));
    on(WebcastEvent.CHAT, 'COMMENT', (d) => ({ comment: String(d.comment ?? '') }));
    on(WebcastEvent.GIFT, 'GIFT', (d) => ({
      gift: {
        id: String(d.giftId ?? '') || undefined,
        name: String(d.giftName ?? 'Quà tặng'),
        quantity: Number(d.repeatCount ?? 1),
        repeatEnd: Boolean(d.repeatEnd),
      },
    }));
    on(WebcastEvent.FOLLOW, 'FOLLOW');
    on(WebcastEvent.SHARE, 'SHARE');
    on(WebcastEvent.MEMBER, 'JOIN');
    c.on(WebcastEvent.STREAM_END, () => this.fail(new Error('Phiên LIVE đã kết thúc')));
    c.on(ControlEvent.DISCONNECTED, () => {
      if (!this.explicit) this.fail(new Error('Mất kết nối với TikTok LIVE'));
    });
  }
  private fail(err: unknown) {
    const message = getTikTokConnectionErrorMessage(err);
    this.set({ state: 'ERROR', error: message });
    this.emit('error-safe', message);
    if (this.auto && !this.explicit && this.username) {
      const delay = Math.min(30000, 1000 * 2 ** this.attempt++);
      this.set({
        state: 'RECONNECTING',
        reconnectAttempt: this.attempt,
        nextReconnectAt: Date.now() + delay,
      });
      clearTimeout(this.timer);
      this.timer = setTimeout(
        () => void this.connect(this.username!, this.auto).catch(() => undefined),
        delay,
      );
    }
  }
  async disconnect(explicit = true) {
    this.explicit = explicit;
    clearTimeout(this.timer);
    const c = this.conn;
    this.conn = undefined;
    if (c) {
      c.removeAllListeners();
      try {
        await c.disconnect();
      } catch {}
    }
    if (explicit) {
      this.attempt = 0;
      this.set({
        state: 'DISCONNECTED',
        connectedAt: undefined,
        nextReconnectAt: undefined,
        reconnectAttempt: 0,
      });
    }
  }
}

export function getTikTokConnectionErrorMessage(
  error: unknown,
  hasSignApiKey = Boolean(process.env.TIKTOK_SIGN_API_KEY?.trim()),
): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/EulerRoute|EulerStream|Business plan|requires a Business/i.test(message)) {
    if (hasSignApiKey)
      return 'API key đã được server nạp nhưng EulerStream từ chối quyền TikTok LIVE Signature. Hãy kiểm tra key thuộc đúng tài khoản, còn hiệu lực và gói/add-on Signature đã được kích hoạt.';
    return 'Kết nối TikTok thật cần API key có quyền TikTok LIVE Signature của EulerStream. Thêm TIKTOK_SIGN_API_KEY vào file .env rồi khởi động lại server, hoặc tiếp tục dùng chế độ giả lập.';
  }
  if (/offline|not live|UserOffline/i.test(message))
    return 'Tài khoản này hiện không phát LIVE công khai hoặc TikTok chưa cung cấp room ID.';
  if (/captcha/i.test(message))
    return 'TikTok yêu cầu CAPTCHA. Ứng dụng không tự động vượt CAPTCHA; hãy thử lại sau.';
  return message;
}
