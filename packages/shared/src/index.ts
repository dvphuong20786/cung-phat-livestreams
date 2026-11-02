import { z } from 'zod';

export const liveEventTypes = ['LIKE', 'COMMENT', 'GIFT', 'FOLLOW', 'SHARE', 'JOIN'] as const;
export type LiveEventType = (typeof liveEventTypes)[number];
export type EventSource = 'TIKTOK' | 'SIMULATOR';
export type ConnectionState =
  'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';
export type TempleAction =
  'ENTER_TEMPLE' | 'PRAY' | 'OFFER_FLOWERS' | 'OFFER_INCENSE' | 'WELCOME' | 'NONE';
export type TempleGameActionType = Exclude<TempleAction, 'NONE'> | 'BELL_EFFECT' | 'SAY_COMMENT';
export interface TempleGameAction {
  actionId: string;
  userId: string;
  username: string;
  nickname: string;
  actionType: TempleGameActionType;
  quantity?: number;
  giftName?: string;
  giftCoinValue?: number;
  message?: string;
  isSimulated?: boolean;
  eventType?: LiveEventType;
  avatarUrl?: string;
  seatedAt?: number;
  seatIndex?: number;
  meritPoints?: number;
  level?: number;
  rankName?: string;
  createdAt: number;
}

export interface LiveEvent {
  id: string;
  source: EventSource;
  type: LiveEventType;
  user: { id?: string; username: string; nickname: string; avatarUrl?: string };
  likeCount?: number;
  comment?: string;
  gift?: {
    id?: string;
    name: string;
    quantity: number;
    coinValue?: number;
    repeatEnd?: boolean;
  };
  timestamp: number;
}
export interface SourceStats {
  likes: number;
  giftQuantity: number;
  giftEvents: number;
  comments: number;
  follows: number;
  shares: number;
  joins: number;
  uniqueUsers: number;
  eventRate: number;
  lastEventTimestamp?: number;
}
export interface Statistics {
  total: SourceStats;
  real: SourceStats;
  simulated: SourceStats;
}
export interface ConnectionStatus {
  state: ConnectionState;
  username?: string;
  error?: string;
  connectedAt?: number;
  reconnectAttempt: number;
  nextReconnectAt?: number;
}
export interface Snapshot {
  connection: ConnectionStatus;
  events: LiveEvent[];
  stats: Statistics;
  simulation?: { autoEnabled: boolean };
}

const clean = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .transform((s) => s.replace(/[<>]/g, ''));
export function normalizeTikTokUsername(input: string): string {
  const value = input.trim();
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const hostname = url.hostname.toLocaleLowerCase();
      if (hostname !== 'tiktok.com' && !hostname.endsWith('.tiktok.com')) return '';
      const match = url.pathname.match(/^\/@([^/]+)/);
      return match ? decodeURIComponent(match[1]) : '';
    } catch {
      return '';
    }
  }
  return value.replace(/^@/, '').replace(/\/live\/?$/i, '');
}
const tiktokUsernameSchema = z
  .string()
  .transform(normalizeTikTokUsername)
  .pipe(
    z
      .string()
      .min(1, { message: 'Hãy nhập username hoặc URL TikTok LIVE hợp lệ' })
      .max(30, { message: 'Username TikTok không được quá 30 ký tự' })
      .regex(/^[A-Za-z0-9._]+$/, {
        message: 'Username TikTok chỉ được chứa chữ, số, dấu chấm và gạch dưới',
      }),
  );
export const connectSchema = z.object({
  username: tiktokUsernameSchema,
  autoReconnect: z.boolean().default(true),
});
export const simulatorSchema = z.object({
  type: z.enum(liveEventTypes),
  username: clean(40),
  nickname: clean(60),
  likeCount: z.number().int().min(1).max(10000).optional(),
  comment: clean(300).optional(),
  gift: z
    .object({
      id: z.string().max(40).optional(),
      name: clean(80),
      quantity: z.number().int().min(1).max(999),
      coinValue: z.number().int().min(1).max(1_000_000).optional(),
      repeatEnd: z.boolean().optional(),
    })
    .optional(),
});
export type SimulatorInput = z.input<typeof simulatorSchema>;

export function templeActionFor(event: LiveEvent): TempleAction {
  if (event.type === 'LIKE') return 'ENTER_TEMPLE';
  if (event.type === 'COMMENT' && /nam\s*(mô|mo)/i.test(event.comment ?? '')) return 'PRAY';
  if (event.type === 'GIFT')
    return /rose|hoa hồng/i.test(event.gift?.name ?? '') ? 'OFFER_FLOWERS' : 'OFFER_INCENSE';
  if (event.type === 'FOLLOW' || event.type === 'SHARE') return 'WELCOME';
  return 'NONE';
}
export function templeGameActionFor(event: LiveEvent): TempleGameAction | null {
  let actionType: TempleGameActionType | null = null;
  if (event.type === 'LIKE') actionType = 'ENTER_TEMPLE';
  if (
    event.type === 'COMMENT' &&
    /(nam\s*(mô|mo)|a\s*di\s*đà\s*phật)/i.test(event.comment?.normalize('NFC') ?? '')
  )
    actionType = 'PRAY';
  else if (event.type === 'COMMENT') actionType = 'SAY_COMMENT';
  if (event.type === 'GIFT')
    actionType = /rose|hoa hồng/i.test(event.gift?.name ?? '') ? 'OFFER_FLOWERS' : 'OFFER_INCENSE';
  if (event.type === 'FOLLOW') actionType = 'WELCOME';
  if (event.type === 'SHARE') actionType = 'BELL_EFFECT';
  if (event.type === 'JOIN') actionType = 'ENTER_TEMPLE';
  if (!actionType) return null;
  return {
    actionId: event.id,
    userId: event.user.id || event.user.username,
    username: event.user.username,
    nickname: event.user.nickname,
    actionType,
    quantity: event.likeCount ?? event.gift?.quantity,
    giftName: event.gift?.name,
    giftCoinValue: event.gift?.coinValue,
    message: event.comment,
    isSimulated: event.source === 'SIMULATOR',
    eventType: event.type,
    avatarUrl: event.user.avatarUrl,
    createdAt: event.timestamp,
  };
}
export function templeGameActionPriority(action: TempleGameAction): number {
  const sourcePriority = action.isSimulated ? 0 : 1000;
  const eventType =
    action.eventType ??
    (action.actionType === 'OFFER_FLOWERS' || action.actionType === 'OFFER_INCENSE'
      ? 'GIFT'
      : action.actionType === 'SAY_COMMENT' || action.actionType === 'PRAY'
        ? 'COMMENT'
        : action.actionType === 'ENTER_TEMPLE'
          ? 'JOIN'
          : undefined);
  const interactionPriority =
    eventType === 'GIFT'
      ? 500
      : eventType === 'LIKE'
        ? 400
        : eventType === 'COMMENT'
          ? 300
          : eventType === 'FOLLOW' || eventType === 'SHARE'
            ? 200
            : eventType === 'JOIN'
              ? 100
              : 0;
  return sourcePriority + interactionPriority;
}
export function eventMatches(
  event: LiveEvent,
  search: string,
  type: 'ALL' | LiveEventType,
  source: 'ALL' | EventSource = 'ALL',
) {
  const q = search.trim().toLocaleLowerCase();
  return (
    (type === 'ALL' || event.type === type) &&
    (source === 'ALL' || event.source === source) &&
    (!q ||
      event.user.username.toLocaleLowerCase().includes(q) ||
      event.user.nickname.toLocaleLowerCase().includes(q))
  );
}
