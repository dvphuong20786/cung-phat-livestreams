import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { SchemaVersion, createWebSocketUrl } from '@eulerstream/euler-websocket-sdk';
import WebSocket, { type RawData } from 'ws';
import type { ConnectionStatus, LiveEvent, LiveEventType } from '@live/shared';

type JsonRecord = Record<string, unknown>;
type CloudMessage = { type: string; data: JsonRecord };
const ClientCloseCode = {
  STREAM_END: 4005,
  NO_MESSAGES_TIMEOUT: 4006,
  INVALID_OPTIONS: 4400,
  INVALID_AUTH: 4401,
  NO_PERMISSION: 4403,
  NOT_LIVE: 4404,
  KEEPALIVE_TIMEOUT: 4408,
  TOO_MANY_CONNECTIONS: 4429,
  MAX_LIFETIME_EXCEEDED: 4555,
} as const;
const NO_AUTO_RECONNECT_CODES = new Set<number>([
  ClientCloseCode.INVALID_OPTIONS,
  ClientCloseCode.INVALID_AUTH,
  ClientCloseCode.NO_PERMISSION,
  ClientCloseCode.NOT_LIVE,
  ClientCloseCode.TOO_MANY_CONNECTIONS,
  ClientCloseCode.STREAM_END,
]);

export class EulerCloudConnector extends EventEmitter {
  private socket?: WebSocket;
  private reconnectTimer?: NodeJS.Timeout;
  private explicitDisconnect = false;
  private reconnectAttempt = 0;
  private username?: string;
  private autoReconnect = true;
  status: ConnectionStatus = { state: 'DISCONNECTED', reconnectAttempt: 0 };
  private setStatus(update: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...update };
    this.emit('status', this.status);
  }
  async connect(username: string, autoReconnect = true): Promise<void> {
    await this.disconnect(false);
    const apiKey = getEulerApiKey();
    if (!apiKey) throw new Error('Thiếu EULER_API_KEY (hoặc TIKTOK_SIGN_API_KEY) trong file .env.');
    this.explicitDisconnect = false;
    this.username = username;
    this.autoReconnect = autoReconnect;
    this.setStatus({
      state: this.reconnectAttempt ? 'RECONNECTING' : 'CONNECTING',
      username,
      error: undefined,
      reconnectAttempt: this.reconnectAttempt,
      nextReconnectAt: undefined,
    });
    const url = createWebSocketUrl({
      uniqueId: username,
      apiKey,
      features: { bundleEvents: true, schemaVersion: SchemaVersion.v2 },
    });
    const socket = new WebSocket(url);
    this.socket = socket;
    await new Promise<void>((resolve, reject) => {
      let opened = false;
      let socketError = '';
      socket.once('open', () => {
        opened = true;
        this.reconnectAttempt = 0;
        this.setStatus({
          state: 'CONNECTED',
          connectedAt: Date.now(),
          error: undefined,
          reconnectAttempt: 0,
          nextReconnectAt: undefined,
        });
        resolve();
      });
      socket.on('message', (raw) => this.onMessage(raw));
      socket.once('error', (error) => {
        socketError = getCloudSocketErrorMessage(error);
      });
      socket.once('close', (code, reason) => {
        if (this.socket === socket) this.socket = undefined;
        const closeMessage = getCloudCloseMessage(code, reason.toString());
        const message = code === 1006 && socketError ? socketError : closeMessage;
        if (!opened) reject(new Error(message));
        if (!this.explicitDisconnect) this.fail(message, code);
      });
    });
  }
  private onMessage(raw: RawData): void {
    try {
      const payload = JSON.parse(raw.toString()) as unknown;
      for (const cloudMessage of readCloudMessages(payload)) {
        const event = normalizeCloudMessage(cloudMessage);
        if (event) this.emit('event', event);
      }
    } catch {
      this.emit(
        'error-safe',
        'EulerStream gửi một gói dữ liệu không hợp lệ; gói này đã được bỏ qua.',
      );
    }
  }
  private fail(message: string, closeCode: number): void {
    this.setStatus({ state: 'ERROR', error: message, connectedAt: undefined });
    this.emit('error-safe', message);
    if (
      !this.autoReconnect ||
      this.explicitDisconnect ||
      !this.username ||
      NO_AUTO_RECONNECT_CODES.has(closeCode)
    )
      return;
    const delay = Math.min(30000, 1000 * 2 ** this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.setStatus({
      state: 'RECONNECTING',
      reconnectAttempt: this.reconnectAttempt,
      nextReconnectAt: Date.now() + delay,
    });
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(
      () => void this.connect(this.username!, this.autoReconnect).catch(() => undefined),
      delay,
    );
  }
  async disconnect(explicit = true): Promise<void> {
    this.explicitDisconnect = explicit;
    clearTimeout(this.reconnectTimer);
    const socket = this.socket;
    this.socket = undefined;
    if (socket && socket.readyState !== WebSocket.CLOSED) socket.close(1000, 'Client disconnect');
    if (explicit) {
      this.reconnectAttempt = 0;
      this.setStatus({
        state: 'DISCONNECTED',
        connectedAt: undefined,
        error: undefined,
        nextReconnectAt: undefined,
        reconnectAttempt: 0,
      });
    }
  }
}

export function getEulerApiKey(): string | undefined {
  return process.env.EULER_API_KEY?.trim() || process.env.TIKTOK_SIGN_API_KEY?.trim() || undefined;
}
export function getCloudCloseMessage(code: number, reason = ''): string {
  if (code === ClientCloseCode.INVALID_AUTH)
    return 'API key EulerStream không hợp lệ hoặc đã hết hiệu lực.';
  if (code === ClientCloseCode.NO_PERMISSION)
    return 'Gói EulerStream hiện tại không có quyền mở Cloud WebSocket.';
  if (code === ClientCloseCode.NOT_LIVE) return 'Tài khoản này hiện không phát LIVE công khai.';
  if (code === ClientCloseCode.TOO_MANY_CONNECTIONS)
    return 'Đã đạt giới hạn kết nối/request của EulerStream (4429). Ứng dụng đã dừng tự reconnect để không tiêu thêm quota; hãy đóng kết nối cũ hoặc chờ giới hạn được reset rồi bấm Kết nối lại.';
  if (code === ClientCloseCode.STREAM_END) return 'Phiên LIVE đã kết thúc.';
  if (code === ClientCloseCode.INVALID_OPTIONS)
    return 'Tham số kết nối Cloud WebSocket không hợp lệ.';
  if (code === ClientCloseCode.MAX_LIFETIME_EXCEEDED)
    return 'Kết nối đã đạt thời lượng tối đa; ứng dụng sẽ tự kết nối lại.';
  if (code === ClientCloseCode.NO_MESSAGES_TIMEOUT || code === ClientCloseCode.KEEPALIVE_TIMEOUT)
    return 'Cloud WebSocket hết thời gian chờ; ứng dụng sẽ tự kết nối lại.';
  if (reason.trim()) return `EulerStream đóng kết nối (${code}): ${reason.trim()}`;
  return `EulerStream đóng kết nối với mã ${code}.`;
}
function getCloudSocketErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/429|too many/i.test(message))
    return getCloudCloseMessage(ClientCloseCode.TOO_MANY_CONNECTIONS);
  return message.trim()
    ? `Không thể mở EulerStream Cloud WebSocket: ${message}`
    : 'Không thể mở EulerStream Cloud WebSocket (kết nối bị đóng bất thường).';
}
export function readCloudMessages(payload: unknown): CloudMessage[] {
  if (!isRecord(payload)) return [];
  const candidates = Array.isArray(payload.messages) ? payload.messages : [payload];
  return candidates.flatMap((candidate) => {
    if (!isRecord(candidate) || typeof candidate.type !== 'string' || !isRecord(candidate.data))
      return [];
    return [{ type: candidate.type, data: candidate.data }];
  });
}
export function normalizeCloudMessage(message: CloudMessage): LiveEvent | null {
  const typeMap: Record<string, LiveEventType | undefined> = {
    WebcastLikeMessage: 'LIKE',
    WebcastChatMessage: 'COMMENT',
    WebcastGiftMessage: 'GIFT',
    WebcastMemberMessage: 'JOIN',
    SyntheticJoinMessage: 'JOIN',
  };
  let eventType = typeMap[message.type];
  if (message.type === 'WebcastSocialMessage') {
    const action = String(message.data.action ?? '').toLocaleLowerCase();
    if (action === '1' || action.includes('follow')) eventType = 'FOLLOW';
    if (action === '3' || action.includes('share')) eventType = 'SHARE';
  }
  if (!eventType) return null;
  const user = isRecord(message.data.user) ? message.data.user : {};
  const username = readString(user.uniqueId) || readString(user.unique_id) || 'không rõ';
  const nickname = readString(user.nickname) || username;
  const avatarUrl = readAvatarUrl(user);
  const event: LiveEvent = {
    id: randomUUID(),
    source: 'TIKTOK',
    type: eventType,
    timestamp: Date.now(),
    user: {
      id: readString(user.userId) || readString(user.idStr),
      username,
      nickname,
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  };
  if (eventType === 'LIKE') event.likeCount = readNumber(message.data.likeCount, 1);
  if (eventType === 'COMMENT') event.comment = readString(message.data.comment) || '';
  if (eventType === 'GIFT') {
    const repeatEnd = Boolean(message.data.repeatEnd);
    const giftDetails = isRecord(message.data.giftDetails) ? message.data.giftDetails : {};
    const streakable = readNumber(giftDetails.type, 0) === 1;
    if (streakable && !repeatEnd) return null;
    event.gift = {
      id: String(message.data.giftId ?? giftDetails.id ?? '') || undefined,
      name: readString(giftDetails.name) || readString(message.data.giftName) || 'Quà tặng',
      quantity: readNumber(message.data.repeatCount, 1),
      repeatEnd,
    };
  }
  return event;
}
function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim()
    ? value
    : typeof value === 'number'
      ? String(value)
      : undefined;
}
function readNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}
function readAvatarUrl(user: JsonRecord): string | undefined {
  const directAvatarUrl =
    readString(user.profilePictureUrl) ||
    readString(user.avatarUrl) ||
    readString(user.avatar_url) ||
    readString(user.avatarThumb) ||
    readString(user.avatarMedium) ||
    readString(user.avatarLarger);
  if (directAvatarUrl) return directAvatarUrl;

  const imageCandidates = [
    user.profilePicture,
    user.avatarThumb,
    user.avatarMedium,
    user.avatarLarger,
  ];
  for (const imageCandidate of imageCandidates) {
    if (!isRecord(imageCandidate)) continue;

    const urls = Array.isArray(imageCandidate.urlList)
      ? imageCandidate.urlList
      : Array.isArray(imageCandidate.url_list)
        ? imageCandidate.url_list
        : Array.isArray(imageCandidate.urls)
          ? imageCandidate.urls
          : [];
    const avatarUrl = readString(urls[0]) || readString(imageCandidate.url);
    if (avatarUrl) return avatarUrl;
  }

  return undefined;
}
